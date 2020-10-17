import fs from 'fs/promises';
import colors from 'colors';
import md5 from 'md5';
import { Collection as MongoCollection } from 'mongodb';
import WebSocket from 'ws';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Agent } from 'https';

import { Config } from 'class/Config';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';
import { Browser } from 'modules/Browser';
import crop from 'modules/crop';
import { AuthData } from 'gameTypes/AuthData';
import randomString from 'modules/randomString';
import asyncForeach from 'modules/asyncForeach';
import { MyAccountOnServer } from 'gameTypes/MyAccountOnServer';
import { Unit } from 'gameTypes/Unit';
import { Building } from 'gameTypes/Building';
import { Science } from 'gameTypes/Science';
import { Pos } from 'localTypes/Pos';
import { BaseMapAreaWar } from 'gameTypes/BaseMapAreaWar';
import deleteAccount from 'gameCommands/deleteAccount';
import getAllServers from 'gameCommands/getAllServers';
import switchServerAccount from 'gameCommands/switchServerAccount';
import { TopLocalPlayer } from 'gameTypes/TopLocalPlayer';
import getTopLocalPlayers from 'gameCommands/getTopLocalPlayers';
import { Resources } from 'gameTypes/Resources';
import claimTreasureTask from 'gameCommands/claimTreasureTask';

const js = JSON.stringify;

const DEFAULT_WS_RPC_TIMEOUT_MS = 30 * 1000; // 30s
const DEFAULT_WS_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10m
const WS_PING_INTERVAL_MS = 10300; // 10s 300ms
const DEFAULT_WS_CONNECT_TIMEOUT_MS = 10000; // 10s

const WS_FIELD_COMMAND_ID = 'c';
const WS_FIELD_PACKET_INDEX = 'o';
const WS_FIELD_OUTGOING_PAYLOAD = 'p';
const WS_FIELD_INCOMING_DATA = 'd';

const DEFAULT_ALISAFDATA_DETAIL = '#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==';
const DEFAULT_ALISAFDATA_DETAIL_PREFIX = '134';

type GameWsOutgoingPayload = { [key: string]: any };
type GameWsIncomingData = any;

export interface GameWsOutgoingPacket {
    [WS_FIELD_COMMAND_ID]: number;
    [WS_FIELD_PACKET_INDEX]: string;
    [WS_FIELD_OUTGOING_PAYLOAD]: GameWsOutgoingPayload;
}

export interface GameWsIncomingPacket {
    [WS_FIELD_COMMAND_ID]: number;
    [WS_FIELD_PACKET_INDEX]: string;
    [WS_FIELD_INCOMING_DATA]: GameWsIncomingData;
}

export interface GameBotOptions {
    gpToken: string;
    cookieDocId?: string;
    cookieCollection?: MongoCollection;
    userAgent?: string;
    aliSAFDataHash?: string;
    aliSAFDataDetail?: string;
}

export interface GameBotServerInfo {
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

export interface GameBotClientVersion {
    value: string;
    //
    notes?: string;
}

export interface GameBotSession {
    code: string; // KvNBccM8H0KQojZzpXBixGrvpOU3sSCGY01W6lKa6y6TOC3P8lcOR5CoaeyVQzxN
    isPlatformNewUser?: boolean;
    //
    userId?: string; // GH6JHJM0
    sessionKey?: string; // LdpBVqTqBjYlqS518lA...
    providers?: [];
}

export interface GameBotState {
    clientVersion?: GameBotClientVersion;
    session?: GameBotSession;
    serverInfo?: GameBotServerInfo;
    authData?: AuthData;
    eventInfo?: { r1: any; r2: any; r3: any; };
    wsConnected: boolean;
    wsConnecting: boolean;
    wsAuthed: boolean;
    ws?: WebSocket;
    wsPingInterval?: NodeJS.Timer;
    wsInactivityTimeout?: NodeJS.Timer;
    wsNextPacketIndex: number;
    wsCallbacksByCommandId: {
        [commandId: number]: GameBotWsCallback[];
    }
    wsCallbacksByPacketIndex: {
        [packetIndex: string]: GameBotWsCallback;
    };
    wsConnectSemaphoreCallbacks: Function[];
    wsLocalTimeMs?: number;
    wsServerTimeMs?: number;
}

type GameBotWsCallbackRemoveMe = boolean | void;
type GameBotWsCallback = (data: GameWsIncomingData) => Promise<GameBotWsCallbackRemoveMe>;

export interface GameBotWsConnectOptions {
    switchServer?: true;
}

export class GameBot {
    protected config: Config;
    protected options: GameBotOptions;
    protected _cookieJar?: CookieJar;
    protected _browser?: Browser;
    protected state: GameBotState;
    protected gameNotificationsHandlers: {[key: string]: Function} = {};
    public reporter: (msg: string) => void = (msg: string) => console.log(msg);

    public get cookieJar(): CookieJar {
        if (!this._cookieJar) throw Error('GameBot: no cookieJar');
        return this._cookieJar;
    }

    public get browser(): Browser {
        if (!this._browser) throw Error('GameBot: no browser');
        return this._browser;
    }

    constructor(config: Config, options: GameBotOptions) {
        this.config = config;
        this.options = options;

        this.options.userAgent = this.options.userAgent || config.browser.userAgent;

        this.state = {
            wsConnected: false,
            wsConnecting: false,
            wsAuthed: false,
            wsNextPacketIndex: 0,
            wsCallbacksByCommandId: {},
            wsCallbacksByPacketIndex: {},
            wsConnectSemaphoreCallbacks: [],
        };
    }

    public async init(): Promise<void> {
        const { config, options } = this;

        await this.initCookieJar();

        this._browser = new Browser({
            userAgent: options.userAgent,
            cookieJar: this.cookieJar,
            socks5: config.proxy.required ? config.proxy.socks5?.[0] : undefined,
        });

        await this.initGameNotificationsHandlers();
    }

    protected async initGameNotificationsHandlers(): Promise<void> {
        this.gameNotificationsHandlers = {};

        // const names = await fs.readdir('gameNotificationsHandlers');

        // names.forEach(name => {
        //     this.gameNotificationsHandlers[name] = require(`gameNotificationsHandlers/${name}`);
        // });

        // console.log('🔸 this.gameNotificationsHandlers:', this.gameNotificationsHandlers);
    }

    protected async initCookieJar(): Promise<void> {
        const  { config, options } = this;

        if (!options.cookieDocId || !options.cookieCollection) return;

        this._cookieJar = new CookieJar({
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

    protected async getServerInfo(): Promise<void> {
        const { reporter, config, state, browser } = this;

        if (!state.clientVersion) await this.getClientVersion();
        if (!state.clientVersion) throw Error('no state.clientVersion');

        if (!state.session) await this.getSession();
        if (!state.session) throw Error('no state.session');

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

        reporter(`session: ${session.isPlatformNewUser ? 'new user' : 'existing user'}`);
        console.log(`----------\n${gameUrl}\n----------`);
    }

    protected async getClientVersion(): Promise<void> {
        const { reporter, config, state, browser } = this;

        if (config.game.checkIp.required) {
            await this.checkIp();
        }

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

        const r = await browser.get(config.game.checkIp.url);

        const expected = js(config.game.checkIp.expectedAnswer);
        const received = js(r.body);

        if (received !== expected) {
            throw Error(`expected: ${expected}; received: ${received}`);
        }

        reporter(`ip: ${received.match(/\(([^\)]+)\)/)?.[1] || '?'}`);
    }

    public wsRPC(
        commandId: number,
        payload: GameWsOutgoingPayload,
    ): Promise<GameWsIncomingData> {
        return new Promise((resolve, reject) => {
            const { state } = this;

            const responseTimeout = setTimeout(() => {
                reject(`ws rpc failed by timeout: ${DEFAULT_WS_RPC_TIMEOUT_MS}ms`);
                this.disconnectFromWs();
            }, DEFAULT_WS_RPC_TIMEOUT_MS);

            const cb: GameBotWsCallback = async data => {
                clearTimeout(responseTimeout);

                if (data) {
                    resolve(data);
                } else {
                    reject(data);
                }
            };

            this.wsSend(commandId, payload).then(packetIndex => {
                state.wsCallbacksByPacketIndex[packetIndex] = cb;
            }).catch(reject);
        });
    }

    protected async wsSend(
        commandId: number,
        payload: GameWsOutgoingPayload,
    ): Promise<string> {
        const { config, state } = this;

        await this.connectToWs();
        if (!state.ws) throw Error('no ws');

        const packetIndex = String(state.wsNextPacketIndex++);

        const packet: GameWsOutgoingPacket = {
            [WS_FIELD_COMMAND_ID]: commandId,
            [WS_FIELD_PACKET_INDEX]: packetIndex,
            [WS_FIELD_OUTGOING_PAYLOAD]: payload,
        };

        const bytes = js(packet);

        if (config.game.printWsPackets) {
            console.log(
                colors.gray('🔸 out:'),
                colors.gray(crop(bytes, config.game.printWsPacketsMaxLength)));
        }

        state.ws.send(bytes);

        if (commandId !== 0) { // 0 = ping
            this.restartWsInactivityTimeout();
        }

        return packetIndex;
    }

    protected restartWsInactivityTimeout(): void {
        const { state, reporter } = this;

        this.stopWsInactivityTimeout();

        state.wsInactivityTimeout = setTimeout(() => {
            reporter(`ws inactivity: ${DEFAULT_WS_INACTIVITY_TIMEOUT_MS}ms`);
            this.disconnectFromWs();
        }, DEFAULT_WS_INACTIVITY_TIMEOUT_MS);
    }

    protected stopWsInactivityTimeout(): void {
        const { state } = this;

        state.wsInactivityTimeout &&
            clearTimeout(state.wsInactivityTimeout);

        delete state.wsInactivityTimeout;
    }

    protected async connectToWs(options: GameBotWsConnectOptions = {}): Promise<void> {
        const { state } = this;

        if (state.wsConnected) return;

        if (state.wsConnecting) {
            return await this.waitForOtherThreadToConnectToWs();
        }

        state.wsConnecting = true;

        try {
            await this.openWs(options);
        } catch (error) {
            state.wsConnecting = false;
            throw error;
        }

        this.subscribeToAllNotifications();
        this.restartWsInactivityTimeout();
        this.startWsPings();
    }

    protected openWs(options: GameBotWsConnectOptions): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const { reporter, state, config } = this;

            if (state.wsConnected) throw Error('state.wsConnected must be false');
            if (!state.wsConnecting) throw Error('state.wsConnecting must be true');
            if (state.ws) throw Error('state.ws should not exist');

            if (!state.clientVersion) await this.getClientVersion();
            if (!state.clientVersion) throw Error('no state.clientVersion');

            if (!state.session) await this.getSession();
            if (!state.session) throw Error('no state.session');

            if (!state.serverInfo) await this.getServerInfo();
            if (!state.serverInfo) throw Error('no state.serverInfo');

            const needSocks5 = config.proxy.required;
            const socks5 = config.proxy.socks5?.[0];

            if (needSocks5 && !socks5) {
                throw Error('socks5 required but missing in config');
            }

            const wsUrl = state.serverInfo.g123Url;

            const ws = new WebSocket(wsUrl, {
                headers: {
                    'User-Agent': this.options.userAgent,
                },
                origin: config.game.urls.gameWs_origin,
                agent: (needSocks5 && socks5) ?
                    new SocksProxyAgent(socks5) as unknown as Agent :
                    undefined,
            });

            state.ws = ws;
            state.wsNextPacketIndex = (options.switchServer ? state.wsNextPacketIndex : 0) || 0;
            state.wsCallbacksByCommandId = {};
            state.wsCallbacksByPacketIndex = {};

            const wsConnectTimeout = setTimeout(() => {
                reject(`ws connect timeout: ${DEFAULT_WS_CONNECT_TIMEOUT_MS}ms`);
                this.disconnectFromWs();
            }, DEFAULT_WS_CONNECT_TIMEOUT_MS);

            ws.on('erorr', error => {
                clearTimeout(wsConnectTimeout);
                reject(`ws communication error: ${error}`);
            });

            ws.on('open', async () => {
                clearTimeout(wsConnectTimeout);
                reporter(`ws connected to ${wsUrl}`);

                state.wsConnected = true;
                state.wsConnecting = false;

                await this.wsAuth(options);

                resolve();

                await this.triggerWsConnectSemaphore();
            });

            ws.on('message', this.onWsMessage.bind(this));
        });
    }

    protected wsAuth(options: GameBotWsConnectOptions): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const { state, reporter } = this;

            if (state.wsAuthed) throw Error('ws already authed');
            if (!state.session) throw Error('no state.session');
            if (!state.serverInfo) throw Error('no state.serverInfo');
            if (!state.clientVersion) throw Error('no state.clientVersion');

            const aliSAFData = {
                // https://g.alicdn.com/AWSC/WebUMID/1.85.0/um.js
                // hash: '', awsc.um.init({appName:"saf-aliyun-com"}).tn
                // https://g.alicdn.com/AWSC/uab/1.137.1/collina.js
                // detail: '', awsc.uab.getUA()
                hash: this.options.aliSAFDataHash || randomString(88, randomString.alpha.azAZ09_),
                detail: this.options.aliSAFDataDetail || ((state.serverInfo.t || DEFAULT_ALISAFDATA_DETAIL_PREFIX) + DEFAULT_ALISAFDATA_DETAIL),
                fphash: md5(state.session.code + ':' + this.options.userAgent),
            };

            const responseTimeout = setTimeout(() => {
                reject(`ws auth failed by timeout: ${DEFAULT_WS_RPC_TIMEOUT_MS}ms`);
                this.disconnectFromWs();
            }, DEFAULT_WS_RPC_TIMEOUT_MS);

            this.wsSetCallbackByCommandId(1, async data => {
                clearTimeout(responseTimeout);

                if (!data.username ||
                    !data.serverTime ||
                    !data.userInfo
                ) {
                    return reject(`auth failed: ${js(data)}`);
                }

                data.userInfo = JSON.parse(data.userInfo);

                state.authData = data as AuthData;
                delete state.eventInfo;

                state.wsAuthed = true;
                state.wsLocalTimeMs = Date.now();
                state.wsServerTimeMs = state.authData.serverTime * 1000;

                reporter(`auth complete: ${data.username}`);

                resolve();

                return true; // remove me
            });

            await this.wsSend(1, {
                aliSAFData,
                token: state.session.code,
                serverId: state.serverInfo.serverId,
                serverInfoToken: state.serverInfo.serverInfoToken,
                appVersion: state.clientVersion.value,
                platformVer: state.clientVersion.value,
                country: 'JP',
                lang: 'ja',
                nationalFlag: 114,
                ip: '0',
                pf: options.switchServer ? '' : 'g123',
                platform: 'G123',
                channel: 'g123_undefined',
                gaid: '',
                itemId: '',
                g123test: 0,
                changeServer: options.switchServer ? 1 : undefined,
            });
        });
    }

    protected wsSetCallbackByCommandId(commandId: number, cb: GameBotWsCallback): void {
        const { state } = this;

        if (!state.wsCallbacksByCommandId[commandId]) {
            state.wsCallbacksByCommandId[commandId] = [];
        }

        state.wsCallbacksByCommandId[commandId].push(cb);
    }

    protected async onWsMessage(rawData: string): Promise<void> {
        const { config } = this;

        if (config.game.printWsPackets) {
            console.log(
                colors.gray('in:'),
                colors.gray(crop(rawData, config.game.printWsPacketsMaxLength)));
        }

        const packet: GameWsIncomingPacket = JSON.parse(rawData);

        try {
            packet[WS_FIELD_INCOMING_DATA] =
                JSON.parse(packet[WS_FIELD_INCOMING_DATA]);
        } catch {
            // perfectly safe to ignore this error
            // because server may return string with just id instead of json
        }

        const wasAppliedById = await this.applyCallbacksByCommandId(packet);
        const wasAppliedByIndex = await this.applyCallbacksByIndex(packet);

        if (!wasAppliedById && !wasAppliedByIndex) {
            throw Error(`unsupported packet received: ${packet[WS_FIELD_COMMAND_ID]}`);
        }
    }

    protected async applyCallbacksByCommandId(packet: GameWsIncomingPacket): Promise<boolean> {
        const { state } = this;

        const commandId = packet[WS_FIELD_COMMAND_ID];
        const cbs = state.wsCallbacksByCommandId[commandId];

        if (!cbs || cbs.length < 1) {
            return false;
        }

        const newCbs: GameBotWsCallback[] = [];

        for (let i = 0; i < cbs.length; ++i) {
            const cb = cbs[i];
            const removeMe = await cb(packet[WS_FIELD_INCOMING_DATA]);

            if (!removeMe) {
                newCbs.push(cb);
            }
        }

        if (newCbs.length) {
            state.wsCallbacksByCommandId[commandId] = newCbs;
        } else {
            delete state.wsCallbacksByCommandId[commandId];
        }

        return true;
    }

    protected async applyCallbacksByIndex(packet: GameWsIncomingPacket): Promise<boolean> {
        const { state } = this;

        const packetIndex = packet[WS_FIELD_PACKET_INDEX];
        const cb = state.wsCallbacksByPacketIndex[packetIndex];

        if (!cb) return false;

        await cb(packet[WS_FIELD_INCOMING_DATA]);

        // always remove
        delete state.wsCallbacksByPacketIndex[packetIndex];

        return true;
    }

    protected startWsPings(): void {
        const { state } = this;

        state.wsPingInterval &&
            clearInterval(state.wsPingInterval);

        state.wsPingInterval = setInterval(async () => {
            if (!state.wsConnected) return;
            if (state.wsConnecting) return;
            if (!state.wsAuthed) return;
            if (!state.ws) return;

            // {"c":0,"o":"38","p":{}}
            // {"c":0,"s":0,"d":"{\"t\":1602242818291}","o":"38"}
            await this.wsRPC(0, {});
        }, WS_PING_INTERVAL_MS);
    }

    protected async triggerWsConnectSemaphore(): Promise<void> {
        const cbs = this.state.wsConnectSemaphoreCallbacks;

        for (let i = 0; i < cbs.length; ++i) {
            await cbs[i].call(this);
        }

        this.state.wsConnectSemaphoreCallbacks = [];
    }

    protected waitForOtherThreadToConnectToWs(): Promise<void> {
        return new Promise((resolve, reject) => {
            const { reporter, state } = this;

            if (state.wsConnected) return;
            if (!state.wsConnecting) return;

            reporter(`already connecting in other thread, waiting ...`);

            state.wsConnectSemaphoreCallbacks.push(resolve);
        });
    }

    public setEventInfo(r1: any, r2: any, r3: any):void {
        this.state.eventInfo = { r1, r2, r3 };
    }

    public disconnectFromWs(options: GameBotWsConnectOptions = {}): void {
        const { state, reporter } = this;

        if (state.ws) {
            state.ws.close();
        }

        options.switchServer || delete state.clientVersion;
        options.switchServer || delete state.session;
        options.switchServer || delete state.serverInfo;
        delete state.authData;
        delete state.eventInfo;

        state.wsConnected = false;
        state.wsConnecting = false;
        state.wsAuthed = false;

        delete state.ws;

        state.wsPingInterval && clearInterval(state.wsPingInterval);
        state.wsInactivityTimeout && clearTimeout(state.wsInactivityTimeout);

        delete state.wsPingInterval;
        delete state.wsInactivityTimeout;

        state.wsNextPacketIndex = options.switchServer ? state.wsNextPacketIndex : 0;
        state.wsCallbacksByCommandId = {};
        state.wsCallbacksByPacketIndex = {};
        state.wsConnectSemaphoreCallbacks = [];

        delete state.wsLocalTimeMs;
        delete state.wsServerTimeMs;

        reporter(`disconnected from ws${options.switchServer ? ' for reconnection' : ''}`);
    }

    public async switchToServerId({
        targetServerId,
    }: {
        targetServerId: number;
    }): Promise<void> {
        if (!targetServerId) throw Error('no targetServerId');

        const currentServerId = await this.getCurrentServerId();

        if (currentServerId === targetServerId) {
            // already on target server
            return;
        }

        const { serverInfo } = this.state;
        if (!serverInfo) throw Error('no serverInfo');

        this.reporter(`switching server: ${currentServerId} -> ${targetServerId}`);

        const allServers = await getAllServers(this);

        const targetServer = allServers.showServerList.serverList.find(s =>
            s.id === targetServerId &&
            s.url &&
            s.platforms.toLowerCase().includes('g123'));

        if (!targetServer) {
            throw Error(`targetServerId=${targetServerId} is not available for switching`);
        }

        const accountOnTargetServer = allServers.serverList.find(acc =>
            acc.serverId === targetServerId);

        let targetAccountId: string = accountOnTargetServer ? String(accountOnTargetServer.uid) : '';

        await switchServerAccount(this, {
            targetServerId,
            targetAccountId,
        });

        this.disconnectFromWs({
            switchServer: true,
        });

        serverInfo.serverId = targetServer.id;
        serverInfo.g123Url = targetServer.url;
        serverInfo.region = `countrys: ${targetServer.countrys}`;

        await this.connectToWs({
            switchServer: true,
        });
    }

    public async deleteAllAccountsExceptCurrent(): Promise<void> {
        const currentServerId = await this.getCurrentServerId();
        const allServers = await getAllServers(this);

        await asyncForeach<MyAccountOnServer>(allServers.serverList, async acc => {
            if (acc.serverId === currentServerId) return;
            if (!acc.canDel) return;
            if (acc.level >= 60) return; // do not delete precious accounts!

            await deleteAccount(this, { accountId: String(acc.uid) });
        });
    }

    public async getTopLocalPlayer(rank: number): Promise<TopLocalPlayer | null> {
        const PLAYERS_PER_REQUEST = 30;

        const rankIndex = rank - 1;
        const offsetFrom = rankIndex - rankIndex % PLAYERS_PER_REQUEST;
        const offsetTo = offsetFrom + PLAYERS_PER_REQUEST - 1;
        const indexInResponse = rankIndex - offsetFrom;

        const players = await getTopLocalPlayers(this, { offsetFrom, offsetTo });

        const player = players?.[indexInResponse];

        if (!player) {
            this.reporter(`getTopLocalPlayer fail`);
            return null;
        }

        return player;
    }

    protected warn(subject: string | number, text: string): void {
        this.reporter(`----------\n WARNING: bad ${subject}: ${text}\n----------`);
    }

    protected subscribeToAllNotifications(): void {
        const { reporter, warn, state } = this;
        const { authData } = state;

        if (!authData) throw Error('no authData');

        // {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":800.0}","o":null}
        this.wsSetCallbackByCommandId(10001, async data => {
            if (typeof data?.voucher === undefined) return warn(10001, js(data));
            const resources = data as Resources;
            authData.resource = resources;
            reporter('resources received');
        });

        // {"c":10201,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":99999,\"x\":24,\"y\":20,\"id\":\"1710339831034898436\",\"state\":0,\"march\":0}","o":null}
        this.wsSetCallbackByCommandId(10201, async data => {
            if (!data?.id) return warn(10201, js(data));
            const unit = data as Unit;
            await this.updateUnit(unit);
            reporter(`unit added: ${unit.id}`);
        });

        // {"c":10109,"s":0,"d":"{\"buildings\":[{\"broken\":0,\"proStartTime\":0,\"buildingId\":1042,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":20,\"y\":28,\"proCount\":0.0,\"state\":1,\"id\":\"1710390561376658434\",\"proTime\":0.0,\"proLastTime\":0.0}]}","o":null}
        this.wsSetCallbackByCommandId(10109, async data => {
            if (!data?.buildings) return warn(10109, js(data));
            const buildings = data.buildings as Building[];
            await asyncForeach<Building>(buildings, async building => {
                await this.updateBuilding(building);
                reporter(`building updated: ${building.id}`);
            });
        });

        // {"c":10202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":22,\"y\":26,\"id\":\"1710042903487277063\",\"state\":0,\"march\":0}","o":null}
        this.wsSetCallbackByCommandId(10202, async data => {
            if (!data?.id) return warn(10202, js(data));
            const unit = data as Unit;
            authData.armys = authData.armys.filter(u => u.id !== unit.id);
            reporter(`unit removed: ${unit.id}`);
        });

        // {"c":10012,"s":0,"d":"{\"power\":\"516.0\"}","o":null}
        this.wsSetCallbackByCommandId(10012, async data => {
            if (!data?.power) return warn(10012, js(data));
            authData.star = Number(data.power);
            reporter(`power Δ: ${authData.star}`);
        });

        // {"c":10124,"s":0,"d":"{\"treasureTasks\":[{\"num\":1.0,\"state\":1,\"taskId\":3}],\"isUpdate\":1}","o":null}
        this.wsSetCallbackByCommandId(10124, async data => {
            if (!data?.treasureTasks) return warn(10124, js(data));

            // state 0 - not finished
            // state 1 - can be claimed
            // state 2 - claimed

            await asyncForeach<any>(data.treasureTasks, async task => {
                if (task.state === 1) {
                    await claimTreasureTask(this, { taskId: task.taskId });
                }
            });
        });

        // {"c":10041,"s":0,"d":"{\"level\":5,\"exp\":2880.0}","o":null}
        this.wsSetCallbackByCommandId(10041, async data => {
            if (!data?.level || !data?.exp) return warn(10041, js(data));

            const levelDelta = data.level - authData.level;

            if (levelDelta) {
                reporter(`level up: ${authData.level} -> ${data.level}`);
            }

            authData.level = data.level;
            authData.exp = data.exp;
        });

        // {"c":10707,"s":0,"d":"{\"msgType\":2,\"nowAreaWar\":{\"areaId\":805,\"chapterId\":1,\"pve_node\":{\"icon\":\"boss1\",\"name\":\"104117\",\"order\":1},\"extInfos\":[{\"itsBoss\":0,\"award\":0,\"levelPoint\":1}],\"finish\":1,\"pve_level\":{\"reward\":100101,\"node\":1,\"using\":1,\"player_number\":1,\"id\":101,\"enemy_type\":0,\"enemy_config\":\"10001\",\"cost_energy\":0,\"player_type\":0,\"order\":1,\"level_count\":1},\"pveId\":101}}","o":null}
        this.wsSetCallbackByCommandId(10707, async data => {
            if (!data?.nowAreaWar) return warn(10707, js(data));
            await this.updateAreaWar(data.nowAreaWar);
            reporter(`areaWars Δ: areaId=${data.nowAreaWar.areaId} pveId=${data.nowAreaWar.pveId}`);
        });

        // {"c":10708,"s":0,"d":"{\"allAreaWar\":[]}","o":null}
        // {"c":10104,"s":0,"d":"{\"areaId\":606}","o":null}

        // @TODO async
        // {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":22,\"y\":26,\"li\":[]}]}","o":null}

    }

    public async getCurrentServerTime(): Promise<number> {
        const { state } = this;

        await this.connectToWs();

        if (!state.wsLocalTimeMs || !state.wsServerTimeMs) {
            throw Error('wsLocalTimeMs or wsServerTimeMs is missing');
        }

        const deltaMs = state.wsLocalTimeMs - state.wsServerTimeMs;
        const localMs = Date.now();
        const serverMs = localMs - deltaMs;

        return Math.floor(serverMs / 1000);
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

    public async getAllUnits(): Promise<Unit[]> {
        await this.connectToWs();
        if (!this.state.authData) throw Error('no authData');
        return this.state.authData.armys;
    }

    public async getAllBuildings(): Promise<Building[]> {
        await this.connectToWs();
        if (!this.state.authData) throw Error('no authData');
        return this.state.authData.buildings;
    }

    public async getAllAreaWars(): Promise<BaseMapAreaWar[]> {
        await this.connectToWs();
        if (!this.state.authData) throw Error('no authData');
        return this.state.authData.areaWars;
    }

    public async getAllSciences(): Promise<Science[]> {
        await this.connectToWs();
        if (!this.state.authData) throw Error('no authData');
        return this.state.authData.sciences;
    }

    public async getAllBaseMapAreas(): Promise<number[]> {
        await this.connectToWs();
        if (!this.state.authData) throw Error('no authData');
        return this.state.authData.areas;
    }

    public async getBuildingsByTypeId(buildingTypeId: number): Promise<Building[]> {
        return (await this.getAllBuildings()).filter(b =>
            b.buildingId === buildingTypeId);
    }

    // @TODO what about warehouse?
    public async getMergeableUnits(): Promise<Unit[]> {
        return (await this.getAllUnits()).filter(u =>
            // not marching
            u.march === 0 &&
            // not damaged
            u.state === 0);
    }

    public async getFightableUnits(): Promise<Unit[]> {
        return (await this.getAllUnits()).filter(u =>
            // not marching
            u.march === 0 &&
            // not damaged
            u.state === 0);
    }

    public async getUnitsByTypeId(unitTypeId: number): Promise<Unit[]> {
        return (await this.getAllUnits()).filter(u =>
            u.armyId === unitTypeId);
    }

    public async getMergeableUnitsGroups(): Promise<{[key: string]: Unit[]}> {
        const groups: {[key: string]: Unit[]} = {};

        const mergeableUnits = await this.getMergeableUnits();

        mergeableUnits.forEach(u => {
            groups[u.armyId] = groups[u.armyId] || [];
            groups[u.armyId].push(u);
        });

        return groups;
    }

    public async getStrongestUnitsForFight(maxUnitsAmount: number = 1): Promise<Unit[]> {
        if (maxUnitsAmount < 1 || maxUnitsAmount > 9) {
            throw Error(`invalid maxUnitsAmount: ${maxUnitsAmount}`);
        }

        const units = await this.getFightableUnits();

        if (units.length < 1) {
            throw Error(`not enough units for fight`);
        }

        // @TODO army units are always weakest because 10001 is less than 20001
        units.sort((u1, u2) => u1.armyId > u2.armyId ? -1 : u1.armyId < u2.armyId ? 1 : 0);

        return units.slice(0, maxUnitsAmount);
    }

    public async updateUnitTypeId(unitId: string, unitTypeId: number): Promise<void> {
        const units = await this.getAllUnits();

        units.forEach(u => {
            if (u.id === unitId) {
                u.armyId = unitTypeId;
            }
        });
    }

    public async updateUnit(unit: Unit): Promise<void> {
        const units = await this.getAllUnits();
        let updated = false;

        units.forEach(u => {
            if (u.id === unit.id) {
                Object.assign(u, unit);
                updated = true;
            }
        });

        if (!updated) {
            units.push(unit);
        }
    }

    public async updateAreaWar(areaWar: BaseMapAreaWar): Promise<void> {
        const areaWars = await this.getAllAreaWars();
        let updated = false;

        areaWars.forEach(aw => {
            if (aw.areaId === aw.areaId) {
                Object.assign(aw, areaWar);
                updated = true;
            }
        });

        if (!updated) {
            areaWars.push(areaWar);
        }
    }

    public async updateBuilding(building: Building): Promise<void> {
        const buildings = await this.getAllBuildings();
        let updated = false;

        buildings.forEach(b => {
            if (b.id === building.id) {
                Object.assign(b, building);
                updated = true;
            }
        });

        if (!updated) {
            buildings.push(building);
        }
    }

    public async updateScience(science: Science): Promise<void> {
        const sciences = await this.getAllSciences();
        let updated = false;

        sciences.forEach(sc => {
            if (sc.scienceId === science.scienceId) {
                Object.assign(sc, science);
                updated = true;
            }
        });

        if (!updated) {
            sciences.push(science);
        }
    }

    public async isBaseMapAreaAlreadyBought(baseMapAreaId: number): Promise<boolean> {
        if (await this.isBaseMapAreaAlreadyOpened(baseMapAreaId)) return true;
        if (await this.getAreaWarByMapAreaId(baseMapAreaId)) return true;
        return false;
    }

    public async isBaseMapAreaAlreadyOpened(baseMapAreaId: number): Promise<boolean> {
        const areas = await this.getAllBaseMapAreas();
        return areas.includes(baseMapAreaId);
    }

    public async getAreaWarByMapAreaId(baseMapAreaId: number): Promise<BaseMapAreaWar | undefined> {
        const areaWars = await this.getAllAreaWars();
        return areaWars.find(aw => aw.areaId === baseMapAreaId);
    }

    public async isBaseMapAreaStageAlreadyFought(
        baseMapAreaId: number,
        baseMapAreaStageId: number,
    ): Promise<boolean> {
        if (await this.isBaseMapAreaAlreadyOpened(baseMapAreaId)) return true;

        const areaWar = await this.getAreaWarByMapAreaId(baseMapAreaId);
        if (!areaWar) return false;

        if (areaWar.pveId > baseMapAreaStageId) return true;

        return false;
    }

    public async isBuildingAlreadyBuilt(buildingTypeId: number, pos: Pos): Promise<boolean> {
        const buildings = await this.getAllBuildings();
        return Boolean(buildings.find(b =>
            b.buildingId === buildingTypeId &&
            b.x === pos.x &&
            b.y === pos.y));
    }

    public async isScienceAlreadyResearched(scienceId: number): Promise<boolean> {
        const sciences = await this.getAllSciences();
        return Boolean(sciences.find(sc => sc.scienceId === scienceId));
    }
}
