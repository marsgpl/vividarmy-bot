import { Collection as MongoCollection } from 'mongodb';

import { Config } from 'class/Config';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';
import { Browser } from 'modules/Browser';

const js = JSON.stringify;

const DEFAULT_WS_RPC_TIMEOUT_MS = 30000;

interface GameBotOptions {
    gpToken: string;
    cookieDocId?: string;
    cookieCollection?: MongoCollection;
    userAgent?: string;
    aliSAFDataHash?: string;
    aliSAFDataDetail?: string;
}

interface GameBotServerInfo {
    serverId: number; // 601
    serverInfoToken: string; // 'NjAxLGcxMjMsR0g2SkhKTTAsd3NzOi8va25pZ2h0LXVzLTU3Ni50b3B3YXJnYW1lLmNvbS9zNjAxLDE2MDIxNjgwNDU5MjMsZGJlZWUzNzAzNWZjOWZhYmFiMWNjZDBhNmI4YWRjYzMsLA=='
    g123Url: string; // 'wss://knight-us-576.topwargame.com/s601'
    region: string; // 'us-west-1'
    //
    server_status?: number; // 1
    pfuid?: string; // GH6JHJM0
    v?: string; // '1.0.42'
    t?: number; // 219
    log?: string; // 'sslChatToken:0|queryDeviceMapping:218|recommendServer:219|'
    appUrl?: string; // 'wss://knight-us-sh-576.rivergame.net/s601'
    url?: string; // 'wss://knight-us-576.topwargame.com/s601'
    ruUrl?: string; // 'wss://knight-us-576.topwargame.com/s601'
    badDev?: string; // 'com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam'
    globalUrl?: string; // 'wss://knight-us-576.topwargame.com/s601'
    wssLines?: string; // 'knight-us.topwargame.com|wss://knight-us-576.topwargame.com/s601,knight-us-gcp-576.topwargame.com|wss://knight-us-gcp-576.topwargame.com/s601,knight-us-sh-axesdn-576.rivergame.net|wss://knight-us-sh-axesdn-576.rivergame.net/s601,knight-us-sh-tencent.rivergame.net|wss://knight-us-sh-tencent-576.rivergame.net/s601,knight-us-br.topwarapp.com|wss://knight-us-br-576.topwarapp.com/s601,knight-us-br-576.topwarapp.com|wss://knight-us-br-576.topwarapp.com/s601,knight-us-sh-tencent-576.rivergame.net|wss://knight-us-sh-tencent-576.rivergame.net/s601,knight-us-gcp.topwargame.com|wss://knight-us-gcp-576.topwargame.com/s601,knight-us-576.topwargame.com|wss://knight-us-576.topwargame.com/s601,knight-us-cloudflare-576.topwarapp.com|wss://knight-us-cloudflare-576.topwarapp.com/s601,knight-us-sh.rivergame.net|wss://knight-us-sh-576.rivergame.net/s601,knight-us-sh-576.rivergame.net|wss://knight-us-sh-576.rivergame.net/s601,knight-us-sh-axesdn.rivergame.net|wss://knight-us-sh-axesdn-576.rivergame.net/s601,knight-us-cloudflare.topwarapp.com|wss://knight-us-cloudflare-576.topwarapp.com/s601'
    wssLinesCN?: string; // 'knight-us-sh-axesdn-576.rivergame.net|wss://knight-us-sh-axesdn-576.rivergame.net/s601,knight-us-sh-tencent-576.rivergame.net|wss://knight-us-sh-tencent-576.rivergame.net/s601,knight-us-sh-576.rivergame.net|wss://knight-us-sh-576.rivergame.net/s601
    stop_start_time?: number; // 0
    stop_end_time?: number; // 0
    stop_reason?: string; // ''
    showType?: number; // 0
    status?: number; // 0
    country?: string; // ''
    msg?: string; // ''
    now?: number; // 1602168045
}

interface GameBotClientVersion {
    value: string;
    //
    notes?: string;
}

interface GameBotSession {
    code: string; // KvNBccM8H0KQojZzpXBixGrvpOU3sSCGY01W6lKa6y6TOC3P8lcOR5CoaeyVQzxN
    isPlatformNewUser?: boolean;
    //
    userId?: string; // GH6JHJM0
    sessionKey?: string; // LdpBVqTqBjYlqS518lA...
    providers?: [];
}

interface GameBotState {
    serverInfo?: GameBotServerInfo;
    clientVersion?: GameBotClientVersion;
    session?: GameBotSession;
    wsCallbacksByPacketIndex: {
        [packetIndex: number]: GameBotWsCallback;
    };
}

type GameBotWsCallback = (data: any) => void;

export class GameBot {
    protected config: Config;
    protected options: GameBotOptions;
    protected cookieJar?: CookieJar;
    protected browser?: Browser;
    protected state: GameBotState;
    public reporter: (msg: string) => void = (msg: string) => console.log(msg);

    constructor(config: Config, options: GameBotOptions) {
        this.config = config;
        this.options = options;

        this.state = {
            wsCallbacksByPacketIndex: {},
        };
    }

    public async init(): Promise<void> {
        const { config, options } = this;

        await this.initCookieJar();

        this.browser = new Browser({
            userAgent: options.userAgent || config.browser.userAgent,
            cookieJar: this.cookieJar,
            socks5: config.proxy.required ? config.proxy.socks5?.[0] : undefined,
        });

        if (config.game.checkIp.required) {
            await this.checkIp();
        }
    }

    protected async initCookieJar(): Promise<void> {
        const  { config, options } = this;

        if (!options.cookieDocId || !options.cookieCollection) return;

        this.cookieJar = new CookieJar({
            storageType: CookieJarStorageType.MONGO_DB,
            storageConfig: {
                collection: options.cookieCollection,
                docId: options.cookieDocId,
            },
        });

        await this.cookieJar.loadFromStorage();

        if (options.gpToken.length > 0) {
            const rawCookie = this.cookieJar.buildRawCookie(
                config.game.gpTokenCookie.name,
                options.gpToken,
                config.game.gpTokenCookie.params);

            await this.cookieJar.putRawCookiesAndSave(
                config.game.gpTokenCookie.params.host,
                [rawCookie]);
        }
    }

    public getGpToken(): string {
        if (this.cookieJar) {
            const cookieKey = this.cookieJar.getCookieKey(
                this.config.game.gpTokenCookie.params.host,
                this.config.game.gpTokenCookie.name);

            const cookieValue = this.cookieJar.getCookieValueByKey(cookieKey);

            if (cookieValue) {
                return cookieValue;
            }
        }

        return this.options.gpToken;
    }

    public async getCurrentServerId(): Promise<number> {
        const { state } = this;

        if (!state.serverInfo) await this.getServerInfo();
        if (!state.serverInfo) throw Error('no state.serverInfo');

        return state.serverInfo.serverId;
    }

    protected async getServerInfo(): Promise<void> {
        const { reporter, config, state, browser } = this;

        reporter(`requesting server info ...`);

        if (!state.clientVersion) await this.getClientVersion();
        if (!state.clientVersion) throw Error('no state.clientVersion');

        if (!state.session) await this.getSession();
        if (!state.session) throw Error('no state.session');

        if (!browser) throw Error('no browser');

        const url = config.game.urls.getServerInfo
            .replace(':ts:', String(Date.now()))
            .replace(':token:', state.session.code)
            .replace(':appVersion:', state.clientVersion.value);

        const r = await browser.get(url, {}, {
            referer: config.game.urls.getServerInfo_referer,
            origin: config.game.urls.getServerInfo_origin,
        });

        const serverInfo = JSON.parse(r.body) as GameBotServerInfo;

        if (!serverInfo.serverId ||
            !serverInfo.serverInfoToken ||
            !serverInfo.g123Url ||
            !serverInfo.region
        ) {
            throw Error(`fail: ${r.body}`);
        }

        if (serverInfo.now &&
            serverInfo.stop_end_time &&
            serverInfo.stop_end_time > serverInfo.now
        ) {
            const secondsLeft = serverInfo.stop_end_time - serverInfo.now + 1;
            throw Error(`maintenance: ${js(serverInfo)}; duration: ${secondsLeft}s`);
        }

        state.serverInfo = serverInfo;

        reporter(`server info: ${serverInfo.serverId} ${serverInfo.region}`);
    }

    protected async getSession(): Promise<void> {
        const { reporter, config, state, browser } = this;

        reporter(`requesting game session ...`);

        if (!browser) throw Error('no browser');

        const url = config.game.urls.getSession
            .replace(':from:', encodeURIComponent(config.game.urls.shell));

        const r = await browser.get(url, {}, {
            referer: config.game.urls.shell,
        });

        const session = JSON.parse(r.body) as GameBotSession;

        if (!session.code) {
            throw Error(`fail: ${r.body}`);
        }

        state.session = session;

        const gameUrl = config.game.urls.game
            .replace(':code:', session.code);

        reporter(`game session:${session.isPlatformNewUser ? ' (new user)' : ''} <${gameUrl}>`);
    }

    protected async getClientVersion(): Promise<void> {
        const { reporter, config, state, browser } = this;

        reporter(`requesting client version ...`);

        if (!browser) throw Error('no browser');

        const url = config.game.urls.getClientVersion
            .replace(':ts:', String(Date.now()));

        const r = await browser.get(url, {}, {
            referer: config.game.urls.getClientVersion_referer,
        });

        const [value, notes] = r.body.trim().split('|');

        if (!value) {
            throw Error(`fail: ${r.body}`);
        }

        state.clientVersion = { value, notes };

        reporter(`client version: ${value} | ${notes}`);
    }

    protected async checkIp(): Promise<void> {
        const { reporter, config, browser } = this;

        reporter(`checking ip ...`);

        if (!browser) throw Error('no browser');

        const r = await browser.get(config.game.checkIp.url);

        const expected = js(config.game.checkIp.expectedAnswer);
        const received = js(r.body);

        if (received !== expected) {
            throw Error(`expected: ${expected}; received: ${received}`);
        }

        reporter(`ip: ${received.match(/\(([^\)]+)\)/)?.[1] || '?'}`);
    }

    public wsRPC(commandId: number, payload: {[key: string]: any}): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const { reporter, state } = this;

            reporter(`calling ws rpc: ${commandId} ...`);

            const responseTimeout = setTimeout(() => {
                this.disconnectFromWs();
                reject(`ws rpc failed by timeout: ${DEFAULT_WS_RPC_TIMEOUT_MS}ms`);
            }, DEFAULT_WS_RPC_TIMEOUT_MS);

            const packetIndex = await this.wsSend(commandId, payload);

            state.wsCallbacksByPacketIndex[packetIndex] = async data => {
                clearTimeout(responseTimeout);

                if (data) {
                    resolve(data);
                } else {
                    reject(data);
                }
            };
        });
    }

    public async wsSend(commandId: number, payload: {[key: string]: any}): Promise<number> {
        throw Error('TODO: wsSend');
    }

    public disconnectFromWs(): void {
        throw Error('TODO: disconnectFromWs');
    }
}
