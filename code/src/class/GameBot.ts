import md5 from 'md5';
import WebSocket from 'ws';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Agent } from 'https';

import { Config } from 'class/Config';
import { Browser } from 'modules/Browser';
import { CookieJar } from 'modules/CookieJar';
import { BaseBot } from 'class/BaseBot';
import * as GAME_WS_FIELDS from 'constants/gameWsFields';
import * as GAME_WS_COMMANDS from 'constants/gameWsCommands';
import randomString from 'modules/randomString';

const DEFAULT_WS_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10m
const DEFAULT_WS_RPC_TIMEOUT_MS = 30 * 1000; // 30s
const WS_PING_INTERVAL_MS = 11000; // 11s

const DEFAULT_ALISAFDATA_DETAIL = '#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==';
const DEFAULT_ALISAFDATA_DETAIL_PREFIX = '134';

export type GameWsCallbackRemoveMe = boolean | void;
export type GameWsCallback = (data: any) => Promise<GameWsCallbackRemoveMe>;

export interface GameWsOutgoingPacket {
    [GAME_WS_FIELDS.COMMAND_ID]: number;
    [GAME_WS_FIELDS.PACKET_INDEX]: string;
    [GAME_WS_FIELDS.OUTGOING_PAYLOAD]: {
        [key: string]: any;
    };
}

export interface GameWsIncomingPacket {
    [GAME_WS_FIELDS.COMMAND_ID]: number;
    [GAME_WS_FIELDS.PACKET_INDEX]: string;
    [GAME_WS_FIELDS.INCOMING_DATA]: any; // often - json string
}

interface GameBotState {
    connected: boolean;
    connecting: boolean;
    session?: {
        code: string;
        userId: string;
        isPlatformNewUser: boolean;
        sessionKey: string;
    };
    clientVersion?: string;
    serverInfo?: {
        serverId: number; // 694
        serverInfoToken: string; // Njk0L...LCw=
        g123Url: string; // wss://knight-cn-tencent-520.rivergame.net/s694
        region?: string; // cn-beijing
        t?: number; // 169
    };
    authData?: {
        [key: string]: any;
    }
    ws?: WebSocket;
    wsNextPacketIndex: number;
    wsCallbacksByCommandId: {
        [commandId: number]: GameWsCallback[],
    };
    wsCallbacksByPacketIndex: {
        [packetIndex: string]: GameWsCallback,
    };
    wsPingInterval?: NodeJS.Timeout;
    wsInactivityTimeout?: NodeJS.Timeout;
}

interface GameBotOptions {
    userAgent: string;
    aliSAFDataHash?: string;
    aliSAFDataDetail?: string;
    cookieJar: CookieJar;
    gp_token: string;
    logSensitiveData?: boolean;
}

export class GameBot extends BaseBot {
    protected options: GameBotOptions;
    public state: GameBotState;
    public cookieJar: CookieJar;
    protected browser: Browser;
    public reporter: (msg: string, asReply?: boolean) => void = (msg: string) => console.log(msg);

    constructor(config: Config, options: GameBotOptions) {
        super('GameBot', config);

        this.options = options;

        this.state = {
            connected: false,
            connecting: false,
            wsNextPacketIndex: 0,
            wsCallbacksByCommandId: {},
            wsCallbacksByPacketIndex: {},
        };

        this.cookieJar = options.cookieJar;

        this.browser = new Browser({
            userAgent: options.userAgent,
            cookieJar: this.cookieJar,
            socks5: config.proxy.required ? config.proxy.socks5?.[0] : undefined,
        });
    }

    public getGpToken(): string {
        return this.cookieJar.getCookieValueByKey('g123.jp:gp_token');
    }

    public s(...args: any[]) {
        const { options, reporter } = this;

        if (options.logSensitiveData) {
            reporter(`s: ${JSON.stringify(args)}`);
        }
    }

    public async getPlayerInfo(options: { playerId: number }): Promise<any> {
        return this.wsRPC(GAME_WS_COMMANDS.GET_PLAYER_INFO, {
            uid: String(options.playerId),
        });
    }

    public async getPlayerPosInfo(options: { playerId: number }): Promise<any> {
        return this.wsRPC(GAME_WS_COMMANDS.GET_PLAYER_POS_INFO, {
            targetId: String(options.playerId),
        });
    }

    public async getTopPlayersFromServer(options: { serverId: number }): Promise<any> {
        return this.wsRPC(GAME_WS_COMMANDS.GET_TOP_PLAYERS_FROM_SERVER, {
            type: 4, // 4 - players?
            serverId: options.serverId,
        });
    }

    public async getTopPlayers(options: { offsetFrom: number, offsetTo: number, report?: boolean }): Promise<any> {
        return this.wsRPC(GAME_WS_COMMANDS.GET_TOP_PLAYERS, {
            start: options.offsetFrom,
            end: options.offsetTo,
        }, {
            report: options.report,
        });
    }

    protected async disconnectFromGameWs(): Promise<void> {
        const { state, reporter } = this;

        if (!state.connected) return;
        if (!state.ws) return;

        state.ws.close();

        state.wsPingInterval && clearInterval(state.wsPingInterval);
        state.wsInactivityTimeout && clearTimeout(state.wsInactivityTimeout);

        delete state.ws;
        delete state.wsPingInterval;
        delete state.wsInactivityTimeout;

        delete state.session;
        delete state.clientVersion;
        delete state.serverInfo;
        delete state.authData;

        state.connected = false;

        reporter('disconnected from game');
    }

    public async getAvailServersList(): Promise<any> {
        return this.wsRPC(GAME_WS_COMMANDS.GET_AVAILABLE_SERVERS_LIST, {
            devPlatform: 'g123',
            channel: 'g123',
            lineAddress: '',
        });
    }

    public async switchServerTo(targetServerId: number): Promise<void> {
        const { state, reporter } = this;

        if (!state.serverInfo) throw Error('no serverInfo');

        const currentServerId = state.serverInfo.serverId;

        if (currentServerId === targetServerId) return;

        reporter(`switching server: ${currentServerId} -> ${targetServerId}`);

        const servers = await this.getAvailServersList();

        console.log('🔸 servers:', servers);
    }

    public async connectToWs(): Promise<void> {
        const { state, reporter, config } = this;

        if (state.connected) return;

        if (state.connecting) {
            throw Error('can\'t connect to game: already connecting in other thread; try again later');
        }

        state.connecting = true;

        reporter('connecting to game');

        if (config.game.checkIp.required) {
            try {
                await this.checkIp();
            } catch (error) {
                state.connecting = false;
                throw error;
            }
        }

        try {
            await this.getSession();
        } catch (error) {
            state.connecting = false;
            throw error;
        }

        try {
            await this.getClientVersion();
        } catch (error) {
            state.connecting = false;
            throw error;
        }

        try {
            await this.getServerInfo();
        } catch (error) {
            state.connecting = false;
            throw error;
        }

        try {
            await this.openWs();
        } catch (error) {
            state.connecting = false;
            throw error;
        }

        this.startPings();
        this.startInactivityTimeout();
        this.sendOnEveryLogin();
    }

    protected async sendOnEveryLogin(): Promise<void> {
        // {"c":1652,"o":"18","p":{"type":1}}
        // {"c":1652,"s":0,"d":"{\"stat\":1}","o":"18"}

        const data = await this.wsRPC(GAME_WS_COMMANDS.INIT_STAT, {
            type: 1,
        });

        if (data.stat !== 1) {
            throw Error('init stat error');
        }
    }

    protected startInactivityTimeout(): void {
        const { state, reporter } = this;

        state.wsInactivityTimeout && clearTimeout(state.wsInactivityTimeout);

        state.wsInactivityTimeout = setTimeout(() => {
            const minutes = Math.round(DEFAULT_WS_INACTIVITY_TIMEOUT_MS / 1000 / 60);
            reporter(`inactivity ${minutes}m`);
            this.disconnectFromGameWs();
        }, DEFAULT_WS_INACTIVITY_TIMEOUT_MS);
    }

    protected startPings(): void {
        const { state } = this;

        state.wsPingInterval && clearInterval(state.wsPingInterval);

        state.wsPingInterval = setInterval(() => {
            if (!state.connected) return;
            if (!state.ws) return;

            this.wsSend(GAME_WS_COMMANDS.PING, {});
        }, WS_PING_INTERVAL_MS);
    }

    protected async wsRPC(
        commandId: number,
        payload: {[key: string]: any},
        options?: {report?: boolean},
    ): Promise<any> { return new Promise(async (resolve, reject) => {
        const { state } = this;

        const packetIndex = await this.wsSend(commandId, payload, options);

        const tmt = this.spawnSendTmt();

        state.wsCallbacksByPacketIndex[packetIndex] = async data => {
            clearTimeout(tmt);
            resolve(data);
        };
    }); }

    protected wsSetCallbackByCommandId(commandId: number, cb: GameWsCallback): void {
        const { state } = this;

        if (!state.wsCallbacksByCommandId[commandId]) {
            state.wsCallbacksByCommandId[commandId] = [];
        }

        state.wsCallbacksByCommandId[commandId].push(cb);
    }

    protected async wsSend(
        commandId: number,
        payload: {[key: string]: any},
        options?: {report?: boolean},
    ): Promise<string> {
        const { config, state, reporter } = this;

        await this.connectToWs();

        if (!state.ws) throw Error('no ws');

        const packetIndex = String(state.wsNextPacketIndex++);

        const packet: GameWsOutgoingPacket = {
            [GAME_WS_FIELDS.COMMAND_ID]: commandId,
            [GAME_WS_FIELDS.PACKET_INDEX]: packetIndex,
            [GAME_WS_FIELDS.OUTGOING_PAYLOAD]: payload,
        };

        const packetFormatted = JSON.stringify(packet);

        if (options?.report) {
            reporter(`=> ${packetFormatted}`);
        }

        if (config.game.printWsPackets) {
            console.log('🔸 out:', packetFormatted);
        }

        state.ws.send(packetFormatted);

        this.startInactivityTimeout();

        return packetIndex;
    }

    protected spawnSendTmt(): NodeJS.Timeout {
        const { reporter, state } = this;

        return setTimeout(() => {
            if (!state.connected) return;
            const seconds = Math.round(DEFAULT_WS_RPC_TIMEOUT_MS / 1000);
            reporter(`ws rpc failed by timeout ${seconds}s`);
            this.disconnectFromGameWs();
        }, DEFAULT_WS_RPC_TIMEOUT_MS);
    }

    protected async openWs(options?: { switchServer?: boolean }): Promise<void> { return new Promise((resolve, reject) => {
        const { reporter, config, state } = this;

        if (state.connected) throw Error('disconnect from previous game ws before opening new');
        if (!state.session) throw Error('no session');
        if (!state.serverInfo) throw Error('no serverInfo');

        const self = this;

        const aliSAFData = {
            // https://g.alicdn.com/AWSC/WebUMID/1.85.0/um.js
            // hash: '', awsc.um.init({appName:"saf-aliyun-com"}).tn
            // https://g.alicdn.com/AWSC/uab/1.137.1/collina.js
            // detail: '', awsc.uab.getUA()
            hash: this.options.aliSAFDataHash || randomString(88, randomString.alpha.azAZ09_),
            detail: this.options.aliSAFDataDetail || ((state.serverInfo.t || DEFAULT_ALISAFDATA_DETAIL_PREFIX) + DEFAULT_ALISAFDATA_DETAIL),
            fphash: md5(state.session.code + ':' + this.options.userAgent),
        };

        const wsUrl = state.serverInfo.g123Url;

        const ws = new WebSocket(wsUrl, {
            headers: {
                'User-Agent': this.options.userAgent,
            },
            origin: config.game.urls.gameWs_origin,
            agent: config.proxy.required && config.proxy.socks5 ?
                new SocksProxyAgent(config.proxy.socks5[0]) as unknown as Agent :
                undefined,
        });

        state.ws = ws;
        state.wsNextPacketIndex = (options?.switchServer ? state.wsNextPacketIndex : 0) || 0;
        state.wsCallbacksByCommandId = {};
        state.wsCallbacksByPacketIndex = {};

        ws.on('erorr', () => {
            throw Error('WS communication error');
        });

        ws.on('open', async () => {
            reporter(`connected to ${wsUrl}`);

            state.connecting = false;
            state.connected = true;

            if (!state.session) throw Error('no session');
            if (!state.serverInfo) throw Error('no serverInfo');
            if (!state.clientVersion) throw Error('no clientVersion');

            const tmt = this.spawnSendTmt();

            this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.AUTH, async data => {
                clearTimeout(tmt);

                state.authData = data;

                if (!data.username) {
                    throw Error(`invalid authData: ${JSON.stringify(state.authData).substr(0, 32)}...`);
                }

                reporter(`auth complete: ${data.username}`);

                resolve();

                return true; // remove me
            });

            await this.wsSend(GAME_WS_COMMANDS.AUTH, {
                aliSAFData,
                token: state.session.code,
                serverId: Number(state.serverInfo.serverId),
                serverInfoToken: state.serverInfo.serverInfoToken,
                appVersion: state.clientVersion,
                platformVer: state.clientVersion,
                country: 'JP',
                lang: 'ja',
                nationalFlag: 114,
                ip: '0',
                pf: options?.switchServer ? '' : 'g123',
                platform: 'G123',
                channel: 'g123_undefined',
                gaid: '',
                itemId: '',
                g123test: 0,
                changeServer: options?.switchServer ? 1 : undefined,
            });
        });

        ws.on('message', async (rawData: string) => {
            if (config.game.printWsPackets) {
                console.log('🔸 in:', rawData);
            }

            const packet: GameWsIncomingPacket = JSON.parse(rawData);

            try {
                packet[GAME_WS_FIELDS.INCOMING_DATA] =
                    JSON.parse(packet[GAME_WS_FIELDS.INCOMING_DATA]);
            } catch {}

            await self.applyCallbacksByCommandId(packet);
            await self.applyCallbacksByIndex(packet);
        });
    }); }

    protected async applyCallbacksByIndex(packet: GameWsIncomingPacket): Promise<void> {
        const { state } = this;

        const packetIndex = packet[GAME_WS_FIELDS.PACKET_INDEX];
        const cb = state.wsCallbacksByPacketIndex[packetIndex];

        if (!cb) return;

        await cb(packet[GAME_WS_FIELDS.INCOMING_DATA]);

        // always remove
        delete state.wsCallbacksByPacketIndex[packetIndex];
    }

    protected async applyCallbacksByCommandId(packet: GameWsIncomingPacket): Promise<void> {
        const { state } = this;

        const commandId = packet[GAME_WS_FIELDS.COMMAND_ID];
        const cbs = state.wsCallbacksByCommandId[commandId];

        if (!cbs) return;

        const newCbs: GameWsCallback[] = [];

        for (let i = 0; i < cbs.length; ++i) {
            const cb = cbs[i];
            const removeMe = await cb(packet[GAME_WS_FIELDS.INCOMING_DATA]);

            if (!removeMe) {
                newCbs.push(cb);
            }
        }

        if (newCbs.length) {
            state.wsCallbacksByCommandId[commandId] = newCbs;
        } else {
            delete state.wsCallbacksByCommandId[commandId];
        }
    }

    protected async getServerInfo(): Promise<void> {
        const { reporter, config, state } = this;

        if (!state.session) throw Error('no session');
        if (!state.clientVersion) throw Error('no clientVersion');

        const url = config.game.urls.getServerInfo
            .replace(':ts:', String(Date.now()))
            .replace(':token:', state.session.code)
            .replace(':appVersion:', state.clientVersion);

        this.s(url);

        const r = await this.browser.get(url, {}, {
            referer: config.game.urls.getServerInfo_referer,
            origin: config.game.urls.getServerInfo_origin,
        });

        const serverInfo = JSON.parse(r.body);

        const { serverId, serverInfoToken, g123Url, region } = serverInfo;

        if (!serverId || !serverInfoToken || !g123Url) {
            throw Error(`getServerInfo: invalid: ${r.body}`);
        }

        const { stop_start_time, stop_end_time, msg, stop_reason } = serverInfo;

        if (stop_reason || stop_start_time) {
            throw Error(`maintenance: ${stop_reason}; ${msg}; end time: ${stop_end_time}; ${JSON.stringify(serverInfo)}`);
        }

        state.serverInfo = serverInfo;

        reporter(`server: ${serverId} ${region || 'no region'}`);

        this.s({
            serverInfoToken: serverInfo.serverInfoToken,
        });
    }

    protected async getClientVersion(): Promise<void> {
        const { reporter, config, state } = this;

        const url = config.game.urls.getClientVersion
            .replace(':ts:', String(Date.now()));

        const r = await this.browser.get(url, {}, {
            referer: config.game.urls.getClientVersion_referer,
        });

        const [value, notes] = r.body.split('|');

        if (!value) {
            throw Error(`getClientVersion: invalid: ${r.body}`);
        }

        state.clientVersion = value;

        reporter(`client version: ${value} ${(notes||'').trim()}`);
    }

    protected async getSession(): Promise<void> {
        const { reporter, config, state } = this;

        const authCookie = config.game.gpTokenCookieTemplate
            .replace(':gp_token:', this.options.gp_token);

        await this.cookieJar.putRawCookiesAndSave('', [authCookie]);

        const url = config.game.urls.getSession
            .replace(':from:', encodeURIComponent(config.game.urls.shell));

        this.s(authCookie);

        const r = await this.browser.get(url, {}, {
            referer: config.game.urls.shell,
        });

        const session = JSON.parse(r.body);

        if (!session.code) {
            throw Error(`getSession: invalid: ${r.body}`);
        }

        state.session = session;

        reporter(`is new user: ${session.isPlatformNewUser}`);

        this.s(session);
    }

    protected async checkIp(): Promise<void> {
        const { reporter, config } = this;

        const r = await this.browser.get(config.game.checkIp.url);

        const expected = JSON.stringify(config.game.checkIp.expectedAnswer);
        const received = JSON.stringify(r.body);

        if (received !== expected) {
            throw Error(`checkIp: expected: ${expected}; received: ${received}`);
        }

        reporter(`ip: ${received.match(/\(([^\)]+)\)/)?.[1] || '?'}`);

        this.s(received);
    }
}
