import { Collection as MongoDbCollection } from 'mongodb';

export enum CookieJarStorageType {
    MONGO_DB,
}

export interface CookieJarConfig {
    storageType: CookieJarStorageType;
    storageConfig: CookieJarStorageConfig;
}

export interface CookieJarStorageConfig {
    collection: MongoDbCollection;
    docId: string;
}

export interface CookieJarCookie {
    key: string;
    name: string;
    value: string;
    host: string;
    params: {
        [key: string]: string;
    };
    rawValue: string;
}

export interface CookieJarCookies {
    [key: string]: CookieJarCookie;
}

export interface CookieJarMongoDoc {
    cookies: string;
}

/**
 * @TODO respect cookie path
 * @TODO before save remove expired cookies
 */
export class CookieJar {
    protected cookies: CookieJarCookies;
    protected storageType: CookieJarStorageType;
    protected storageConfig: CookieJarStorageConfig;
    protected wasLoadedFromStorage: boolean = false;

    constructor(config: CookieJarConfig) {
        this.cookies = {};
        this.storageType = config.storageType;
        this.storageConfig = config.storageConfig;
    }

    public async loadFromStorage(): Promise<void> {
        if (this.storageType === CookieJarStorageType.MONGO_DB) {
            await this.loadFromMongo();
            this.wasLoadedFromStorage = true;
        }
    }

    public async saveToStorage(): Promise<void> {
        if (!this.wasLoadedFromStorage) {
            throw Error('load cookies from storage before this action');
        }

        if (this.storageType === CookieJarStorageType.MONGO_DB) {
            await this.saveToMongo();
        }
    }

    protected async loadFromMongo(): Promise<void> {
        const doc = await this.storageConfig.collection.findOne({
            '_id': this.storageConfig.docId,
        }) as CookieJarMongoDoc | null;

        if (doc) {
            this.cookies = JSON.parse(doc.cookies) as CookieJarCookies;
        }
    }

    /**
     * @TODO return UpdateWriteOpResult
     */
    protected async saveToMongo(): Promise<void> {
        const doc: CookieJarMongoDoc = {
            cookies: JSON.stringify(this.cookies),
        };

        await this.storageConfig.collection.updateOne({
            _id: this.storageConfig.docId,
        }, {
            $set: doc,
        }, {
            upsert: true,
        });
    }

    public async putRawCookiesAndSave(host: string, rawCookies: string[]): Promise<void> {
        if (!this.wasLoadedFromStorage) {
            throw Error('load cookies from storage before this action');
        }

        let added = 0;

        rawCookies.forEach(rawCookie => {
            const cookie = this.parseRawCookie(host, rawCookie);
            if (!cookie) return;

            this.cookies[cookie.key] = cookie;
            added++;
        });

        if (added > 0) {
            await this.saveToStorage();
        }
    }

    /**
     * @param rawCookie 'gp_token=XXXdLcNX; path=/; expires=Sun, 15 Sep 2030 14:47:18 GMT; domain=g123.jp; samesite=lax; secure; httponly'
     */
    protected parseRawCookie(host: string, rawCookie: string): CookieJarCookie | null {
        const pairs = rawCookie.split(/;\s*/);

        const cookie: CookieJarCookie = {
            key: '',
            name: '',
            value: '',
            host,
            params: {},
            rawValue: rawCookie,
        };

        pairs.forEach((pair, index) => {
            const parts = pair.split('=');

            let key: string = (parts.shift() || '').trim();
            let value: string = parts.join('=').trim();

            if (index === 0) {
                cookie.name = key;
                cookie.value = value;
            } else {
                key = key.toLowerCase();
                cookie.params[key] = value;
            }
        });

        if (cookie.name.length === 0) {
            return null;
        }

        const domain = this.getCookieDomain(cookie);

        cookie.key = `${domain}:${cookie.name}`;

        return cookie;
    }

    public getCookieDomain(cookie: CookieJarCookie): string {
        return (cookie.params.domain || cookie.host || '').replace(/^\./, '');
    }

    public getCookiesAsHeader(host: string, date: Date): string {
        if (!this.wasLoadedFromStorage) {
            throw Error('load cookies from storage before this action');
        }

        const result: string[] = [];

        Object.keys(this.cookies).forEach(key => {
            const cookie = this.cookies[key];

            if (cookie.params.expires) {
                const expires = new Date(cookie.params.expires);
                if (date > expires) return;
            }

            const domain = this.getCookieDomain(cookie);
            if (host.substr(host.length - domain.length) !== domain) return;

            result.push(cookie.name + '=' + cookie.value);
        });

        return result.join('; ');
    }

    public getCookieValueByKey(key: string): string {
        return this.cookies[key]?.value || '';
    }
}
