const isArrayOf = require('modules/isArrayOf');

class CookieJar {
    static STORAGE_TYPE_MONGO_DB = 'MongoDB';

    constructor(conf) {
        this.cookies = {};

        Object.assign(this, conf);
    }

    checkStorageType() {
        if (this.storageType) {
            if (!ALLOWED_STORAGE_TYPES[this.storageType]) {
                throw Error(`unknown storage type: ${this.storageType}`);
            }
        }
    }

    async loadFromStorage() {
        this.checkStorageType();

        if (this.storageType === CookieJar.STORAGE_TYPE_MONGO_DB) {
            await this.loadFromMongo();
        }
    }

    async saveToStorage() {
        this.checkStorageType();

        if (this.storageType === CookieJar.STORAGE_TYPE_MONGO_DB) {
            await this.saveToMongo();
        }
    }

    async loadFromMongo() {
        const doc = await this.storageConf.collection.findOne({
            '_id': this.storageConf.docId,
        });

        if (doc) {
            this.cookies = JSON.parse(doc.cookies);
        }
    }

    async saveToMongo() {
        await this.storageConf.collection.updateOne({
            _id: this.storageConf.docId,
        }, {
            $set: {
                cookies: JSON.stringify(this.cookies),
            },
        }, {
            upsert: true,
        });
    }

    get(host, date) {
        const result = [];

        for (let id in this.cookies) {
            const cookie = this.cookies[id];

            if (cookie.params.expires) {
                const expires = new Date(cookie.params.expires);
                if (date > expires) continue;
            }

           const domain = this.normalizeCookieDomain(cookie);

            if (host.substr(host.length - domain.length) !== domain) {
                continue;
            }

            result.push(cookie.name + '=' + cookie.value);
        }

        return result.join('; ');
    }

    async put(host, cookies) {
        if (!cookies) return;

        let added = 0;

        if (typeof cookies === 'string') {
            added += this.parseRawCookieAndPut(host, cookies) ? 1 : 0;
        } else if (isArrayOf(cookies, 'string')) {
            cookies.forEach(cookie => {
                added += this.parseRawCookieAndPut(host, cookie) ? 1 : 0;
            });
        } else {
            throw Error('supported cookie formats: Array<string>, string');
        }

        if (added > 0) {
            await this.saveToStorage();
        }
    }

    // gp_token=XXXdLcNX; path=/; expires=Sun, 15 Sep 2030 14:47:18 GMT; domain=g123.jp; samesite=lax; secure; httponly
    parseRawCookieAndPut(host, raw) {
        if (!raw) return false;

        const params = {};
        const cookie = { params, host, raw };
        const pairs = raw.split(/;\s*/);

        pairs.forEach((pair, index) => {
            let [key, value] = pair.split('=');

            if (index === 0) {
                cookie.name = key;
                cookie.value = value === undefined ? true : value;
            } else {
                key = key.toLowerCase();

                if (key === 'expires') {
                    value = new Date(value);
                } else {
                    value = value === undefined ? true : value;
                }

                params[key] = value;
            }
        });

        cookie.id = this.generateCookieId(cookie);

        if (cookie.name) {
            this.cookies[cookie.id] = cookie;
            return true;
        } else {
            return false;
        }
    }

    normalizeCookieDomain(cookie) {
        return (cookie.params.domain || cookie.host || '').replace(/^\./, '');
    }

    generateCookieId(cookie) {
        const domain = this.normalizeCookieDomain(cookie);

        return domain + ':' + cookie.name;
    }
}

const ALLOWED_STORAGE_TYPES = {
    [CookieJar.STORAGE_TYPE_MONGO_DB]: true,
};

module.exports = CookieJar;
