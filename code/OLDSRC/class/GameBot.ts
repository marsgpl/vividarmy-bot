import colors from 'colors';
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
import { Unit } from 'types/Unit';
import sleep from 'modules/sleep';
import randomNumber from 'modules/randomNumber';
import { BaseTile } from 'types/BaseTile';
import { Building } from 'types/Building';
import { MyServer } from 'types/MyServer';
import crop from 'modules/crop';

const js = JSON.stringify;

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
    };
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
    mutex: {
        armyTipClaim: {[key: string]: true},
        treasureTaskClaim: {[key: string]: true},
    };
    resources?: {
        voucher?: number;
        honor?: number;
        metal?: number;
        soil?: number;
        gold?: number; // red diamonds
        paid_gold?: number;
        free_gold?: number;
        coal?: number;
        wood?: number;
        military?: number;
        expedition_coin?: number;
        oila?: number;
        jungong?: number;
        coin?: number; // gold
        oil?: number; // ???
    };
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
    protected state: GameBotState;
    protected cookieJar: CookieJar;
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
            mutex: {
                armyTipClaim: {},
                treasureTaskClaim: {},
            },
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
            reporter(colors.red(`s: ${js(args)}`));
        }
    }

    public async disconnectFromGameWs(options?: { reconnecting: boolean }): Promise<void> {
        const { state, reporter } = this;

        if (!state.connected) return;
        if (!state.ws) return;

        state.ws.close();

        state.wsPingInterval && clearInterval(state.wsPingInterval);
        state.wsInactivityTimeout && clearTimeout(state.wsInactivityTimeout);

        delete state.ws;
        delete state.wsPingInterval;
        delete state.wsInactivityTimeout;

        options?.reconnecting || delete state.session;
        options?.reconnecting || delete state.clientVersion;
        options?.reconnecting || delete state.serverInfo;

        delete state.authData;

        state.connected = false;

        reporter(options?.reconnecting ?
            'disconnected from game for reconnection' :
            'disconnected from game');
    }

    public async switchServerTo(targetServerId: number, platform?: string): Promise<void> {
        const { state, reporter } = this;

        if (!state.serverInfo) throw Error('no serverInfo');

        const currentServerId = state.serverInfo.serverId;
        const currentServerId2 = state.authData?.k;
        const currentServerId3 = state.authData?.currk;

        if (currentServerId != currentServerId2 || currentServerId != currentServerId3) {
            throw Error(`current server id is inconsistent: serverInfo.serverId=${currentServerId} authData.k=${currentServerId2} authData.currk=${currentServerId3}`);
        }

        if (currentServerId === targetServerId) return;

        reporter(`switching server: ${currentServerId} -> ${targetServerId}`);

        const servers = await this.getAvailServersList(platform);

        const allAvailableServers = servers.showServerList.serverList;
        const myServers: MyServer[] = servers.serverList;

        const existingTargetServer: MyServer | undefined = myServers
            .find(s => s.serverId == targetServerId);

        const targetServer = allAvailableServers.find((server: {[key: string]: any}) =>
        server.id === targetServerId);

        if (!targetServer) {
            throw Error(`server id ${targetServerId} not found in all servers list: ${allAvailableServers.map((s:any)=>s.id).join(', ')}`);
        }

        const isG123Supported = targetServer.platforms.includes('g123');

        if (!isG123Supported) {
            throw Error(`server id ${targetServerId} does not support g123: ${js(targetServer)}`);
        }

        const uidToSwitchTo = existingTargetServer ? String(existingTargetServer.uid) : '0';

        if (existingTargetServer) {
            reporter(`already have acc on ${targetServerId}: switching to it: uid=${uidToSwitchTo}`);
        } else {
            reporter(`no acc on ${targetServerId}: creating it`);
        }

        const switchResponse = await this.wsRPC(GAME_WS_COMMANDS.SWITCH_SERVER, {
            serverId: targetServerId,
            uid: uidToSwitchTo,
            deviceType: 'wxMiniProgram',
        });

        const region = switchResponse.region;

        if (!region) {
            throw Error(`switch failed: ${switchResponse}`);
        }

        state.serverInfo.serverId = targetServer.id;
        state.serverInfo.g123Url = targetServer.url;
        state.serverInfo.region = region;

        await this.reconnectToWs();
    }

    protected async reconnectToWs(): Promise<void> {
        await this.disconnectFromGameWs({ reconnecting: true });
        await this.connectToWs({ reconnecting: true });
    }

    public async connectToWs(options?: { reconnecting: boolean }): Promise<void> {
        const { state, reporter, config } = this;

        if (state.connected) return;

        if (state.connecting) {
            throw Error(`can't connect to game: already connecting in other thread; try again later`);
        }

        state.connecting = true;

        reporter(`${options?.reconnecting ? 're' : ''}connecting to game`);

        const needToCheckIp = config.game.checkIp.required && !options?.reconnecting;
        const needToGetSession = !options?.reconnecting;
        const needToGetClientVersion = !options?.reconnecting;
        const needToGetServerInfo = !options?.reconnecting;

        if (needToCheckIp) {
            try {
                await this.checkIp();
            } catch (error) {
                state.connecting = false;
                throw error;
            }
        }

        if (needToGetSession) {
            try {
                await this.getSession();
            } catch (error) {
                state.connecting = false;
                throw error;
            }
        }

        if (needToGetClientVersion) {
            try {
                await this.getClientVersion();
            } catch (error) {
                state.connecting = false;
                throw error;
            }
        }

        if (needToGetServerInfo) {
            try {
                await this.getServerInfo();
            } catch (error) {
                state.connecting = false;
                throw error;
            }
        }

        try {
            await this.openWs({
                switchServer: options?.reconnecting,
            });
        } catch (error) {
            state.connecting = false;
            throw error;
        }

        this.startPings();
        this.startInactivityTimeout();
        this.subscribeToAllNotifications();
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

        state.wsPingInterval = setInterval(async () => {
            if (!state.connected) return;
            if (!state.ws) return;
            if (!state.authData) return;

            const pong = await this.wsRPC(GAME_WS_COMMANDS.PING, {});

            if (pong.t) {
                state.authData.serverTime = pong.t;
            }
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

        const packetFormatted = js(packet);

        if (options?.report) {
            reporter(`=> ${packetFormatted}`);
        }

        if (config.game.printWsPackets) {
            console.log(colors.gray('🔸 out:'), colors.gray(crop(packetFormatted, 256)));
        }

        state.ws.send(packetFormatted);

        if (commandId !== GAME_WS_COMMANDS.PING) {
            this.startInactivityTimeout();
        }

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
        state.mutex = {
            armyTipClaim: {},
            treasureTaskClaim: {},
        };
        state.resources = {};

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

                state.authData = data as {[key: string]: any};
                state.authData.localTime = Math.floor(Date.now() / 1000);
                state.authData.timeDelta = state.authData.localTime - state.authData.serverTime;

                if (!data.username) {
                    throw Error(`invalid authData: ${js(state.authData).substr(0, 32)}...`);
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
                console.log(colors.gray('🔸 in:'), colors.gray(crop(rawData, 256)));
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

    public getServerTime(): number {
        if (!this.state.authData) throw Error('no auth data');

        const timeDelta = this.state.authData?.timeDelta;
        const localTime = Math.floor(Date.now() / 1000);

        return localTime - timeDelta;
    }

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
            throw Error(`maintenance: ${stop_reason}; ${msg}; end time: ${stop_end_time}; ${js(serverInfo)}`);
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

        this.s(`gp_token=${this.options.gp_token}`);

        const r = await this.browser.get(url, {}, {
            referer: config.game.urls.shell,
        });

        const session = JSON.parse(r.body);

        if (!session.code) {
            throw Error(`getSession: invalid: ${r.body}`);
        }

        this.s(config.game.urls.game.replace(':code:', session.code));

        state.session = session;

        reporter(`is new user: ${session.isPlatformNewUser}`);

        this.s(session);
    }

    protected async checkIp(): Promise<void> {
        const { reporter, config } = this;

        const r = await this.browser.get(config.game.checkIp.url);

        const expected = js(config.game.checkIp.expectedAnswer);
        const received = js(r.body);

        if (received !== expected) {
            throw Error(`checkIp: expected: ${expected}; received: ${received}`);
        }

        reporter(`ip: ${received.match(/\(([^\)]+)\)/)?.[1] || '?'}`);

        this.s(received);
    }

    public getBuildingsByType(typeId: number): Building[] {
        return this.state.authData?.buildings
            .filter((building: Building) => building.buildingId === typeId);
    }

    public getUnitsByType(typeId: number): Unit[] {
        return this.state.authData?.armys
            .filter((unit: Unit) => unit.armyId === typeId);
    }

    public async getAvailServersList(platform: string = 'g123'): Promise<any> {
        return this.wsRPC(GAME_WS_COMMANDS.GET_AVAILABLE_SERVERS_LIST, {
            devPlatform: platform,
            channel: platform,
            lineAddress: '',
        });
    }

    // {"c":857,"o":"2239","p":{"targetUID":"482538062531"}}
    // {"c":857,"s":0,"d":"{\"result\":0,\"targetUID\":482538062531}","o":"2239"}
    public async deleteAccount(accountId: number): Promise<void> {
        this.reporter(`deleting account id=${accountId}`);

        const r = await this.wsRPC(GAME_WS_COMMANDS.DELETE_ACCOUNT, {
            targetUID: String(accountId),
        });

        if (r.result !== 0 || r.targetUID != accountId) {
            throw Error(`failed to delete account: ${js(r)}; accountId=${accountId}`);
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

    public async moveTutorial(options: { step: number }): Promise<void> {
        const r = await this.wsRPC(GAME_WS_COMMANDS.MOVE_TUTORIAL, {
            text: String(options.step),
        });

        if (r.text !== String(options.step)) {
            throw Error(`failed to move tutorial: ${js(r)}; step=${options.step}`);
        }
    }

    // {"c":1652,"o":"18","p":{"type":1}}
    // {"c":1652,"s":0,"d":"{\"stat\":1}","o":"18"}
    // {"c":1652,"o":"557","p":{"type":2}}
    // {"c":1652,"s":0,"d":"{\"stat\":2,\"endTime\":1601748262}","o":"557"}
    public async startRepairingOldTank(): Promise<number> {
        const r1 = await this.wsRPC(GAME_WS_COMMANDS.OLD_TANK_API, { type: 1 });
        if (r1.stat != 1) throw Error(`old tank r1 fail: ${js(r1)}`);

        const r2 = await this.wsRPC(GAME_WS_COMMANDS.OLD_TANK_API, { type: 2 });
        if (r2.stat != 2) throw Error(`old tank r2 fail: ${js(r2)}`);

        return r2.endTime;
    }

    // {"c":101,"o":"508","p":{"id":"1693121665254908937","x":23,"y":23}}
    // {"c":101,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":1601747700,\"buildingId\":1043,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":1,\"productIds\":[\"1693191885520725001\"],\"proId\":0,\"x\":24,\"y\":24,\"proCount\":0.0,\"state\":1,\"id\":\"1693121665254908937\",\"proTime\":1.601747703E9,\"proLastTime\":3.0}}","o":"508"}
    public async orderUnit(building: Building, pos: { x:number, y:number }): Promise<number> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        const r = await this.wsRPC(GAME_WS_COMMANDS.ORDER_UNIT, {
            id: building.id,
            ...pos,
        });

        if (!r.building) {
            throw Error(`failed to order unit: ${js(r)} for building ${js(building)} at pos ${js(pos)}`);
        }

        return r.building.proLastTime;
    }

    public async mergeAllBuildings(sourceBuildingId: number): Promise<void> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        const avail: Building[] = authData.buildings.filter((building: Building) =>
            building.buildingId == sourceBuildingId &&
            building.broken == 0);

        if (avail.length < 2) {
            this.reporter(`wanted to merge buildings with buildingId=${sourceBuildingId} but found: ${js(avail)}`);
            return;
        }

        this.reporter(`merging x${avail.length} of buildingId:${sourceBuildingId}`);

        for (let i = 0; i < avail.length - 1; i += 2) {
            const src = avail[i];
            const target = avail[i + 1];

            await this.merge2Buildings(src, target);
            await sleep(randomNumber(100, 200));
        }
    }

    public async mergeAllUnits(sourceArmyId: number): Promise<void> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        const avail: Unit[] = authData.armys.filter((unit: Unit) =>
                unit.armyId === sourceArmyId &&
                unit.march === 0 &&
                unit.warehouseId === "0");

        if (avail.length < 2) return;

        this.reporter(`merging x${avail.length} of armyId:${sourceArmyId}`);

        for (let i = 0; i < avail.length - 1; i += 2) {
            const src = avail[i];
            const target = avail[i + 1];

            await this.merge2Units(src, target);
            await sleep(randomNumber(100, 200));
        }
    }

    // {"c":113,"o":"176","p":{"id":"1693121665103913992"}}
    // {"c":113,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":1601743515,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":16,\"y\":20,\"proCount\":0.0,\"state\":1,\"id\":\"1693121665103913992\",\"proTime\":1.601743525E9,\"proLastTime\":10.0}}","o":"176"}
    public async repairBuilding(building: Building): Promise<void> {
        const r = await this.wsRPC(GAME_WS_COMMANDS.REPAIR_BUILDING, {
            id: building.id,
        });

        if (!r.building) {
            throw Error(`repairing building id=${building.id} failed: ${js(r)}`);
        }

        this.applyBuildingDelta(r.building);
    }

    protected applyBuildingDelta(changedBuilding: Building): void {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        let added: boolean = false;

        for (let i = 0; i < authData.buildings.length; ++i) {
            const building = authData.buildings[i];

            if (building.id === changedBuilding.id) {
                authData.buildings[i] = changedBuilding;
                added = true;
            }
        }

        if (!added) {
            authData.buildings.push(changedBuilding);
        }
    }

    // {"c":104,"o":"468","p":{"x":26,"y":22,"id":"1693121665103913992"}}
    // {"c":104,"s":0,"d":"{\"x\":16,\"y\":20,\"building\":{\"broken\":0,\"proStartTime\":1601747334,\"buildingId\":1704,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":26,\"y\":22,\"proCount\":0.0,\"state\":1,\"id\":\"1693121665103913992\",\"proTime\":1.601747359E9,\"proLastTime\":25.0}}","o":"468"}
    public async relocateBuilding(building: Building, newPos: { x:number, y:number }): Promise<void> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        const r = await this.wsRPC(GAME_WS_COMMANDS.RELOCATE_BUILDING, {
            id: building.id,
            ...newPos,
        });

        const changedBuilding: Building | undefined = r.building;

        if (!changedBuilding) {
            throw Error(`building relocation failed: ${js(r)}; building id=${building.id}; pos=${js(newPos)}`);
        }

        authData.buildings.forEach((building: Building) => {
            if (building.id == changedBuilding.id) {
                building.x = changedBuilding.x;
                building.y = changedBuilding.y;
            }
        });
    }

    // {"c":110,"o":"262","p":{"x":13,"y":23,"id":"1693121665506567173"}}
    // {"c":110,"s":0,"d":"{\"army\":{\"warehouseId\":\"0\",\"armyId\":10004,\"x\":13,\"y\":23,\"id\":\"1693121665506567173\",\"state\":0,\"march\":0},\"x\":22,\"y\":28}","o":"262"}
    public async relocateUnit(unit: Unit, newPos: { x:number, y:number }): Promise<void> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        const r = await this.wsRPC(GAME_WS_COMMANDS.RELOCATE_UNIT, {
            id: unit.id,
            ...newPos,
        });

        const changedUnit: Unit | undefined = r.army;

        if (!changedUnit) {
            throw Error(`unit relocation failed: ${js(r)}; unit id=${unit.id}; pos=${js(newPos)}`);
        }

        authData.armys.forEach((unit: Unit) => {
            if (unit.id == changedUnit.id) {
                unit.x = changedUnit.x;
                unit.y = changedUnit.y;
            }
        });
    }

    // {"c":102,"o":"429","p":{"id":"1693121665070359559"}}
    // {"c":102,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":20.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"crit\":false,\"building\":{\"broken\":0,\"proStartTime\":1601747040,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":18,\"y\":22,\"proCount\":0.0,\"state\":1,\"id\":\"1693121665070359559\",\"proTime\":1.60174705E9,\"proLastTime\":10.0}}","o":"429"}
    public async collectGoldFromBuilding(building: Building): Promise<void> {
        const { state, reporter } = this;

        if (!this.isGoldMine(building)) {
            throw Error(`not a gold mine: ${building.buildingId}; can't collect gold; ${js(building)}`);
        }

        if (!building.proTime) {
            throw Error(`no proTime: ${js(building)}`);
        }

        const serverTime = this.getServerTime();
        const waitSeconds = building.proTime - serverTime + 1;

        if (waitSeconds > 0) {
            reporter(`waiting ${waitSeconds}s before collecting gold ...`);
            await sleep(waitSeconds * 1000);
        }

        reporter(`collecting gold from building: ${building.id}`);

        const r = await this.wsRPC(GAME_WS_COMMANDS.COLLECT_GOLD_FROM_GOLD_MINE, {
            id: building.id,
        });

        if (!r.reward) {
            reporter(`gold was not claimed from building: ${js(r)}; server time: ${this.getServerTime()}; building: ${js(building)}`);
        } else {
            state.resources = { ...(state.resources || {}), ...r.reward.resource };
        }
    }

    public isGoldMine(building: Building): boolean {
        return building.buildingId >= 1701 && building.buildingId <= 1799;
    }

    // {"c":116,"o":"430","p":{"delId":"1693121665070359559","targetId":"1693121665103913992","isNew":0}}
    // {"c":116,"s":0,"d":"{\"res\":\"suc\",\"targetId\":\"1693121665103913992\",\"buidingId\":1702}","o":"430"}
    public async merge2Buildings(srcBuilding: Building, targetBuilding: Building): Promise<void> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        this.isGoldMine(srcBuilding) &&
            await this.collectGoldFromBuilding(srcBuilding);
        this.isGoldMine(targetBuilding) &&
            await this.collectGoldFromBuilding(targetBuilding);

        const r = await this.wsRPC(GAME_WS_COMMANDS.MERGE_2_BUILDINGS, {
            delId: srcBuilding.id,
            targetId: targetBuilding.id,
            isNew: 0,
        });

        if (r.res !== 'suc') {
            throw Error(`buildings not merged: ${js(r)}; src=${js(srcBuilding)}; dst=${js(targetBuilding)}`);
        }

        authData.buildings.forEach((building: Building) => {
            if (building.id === r.targetId) {
                building.buildingId = r.buidingId;
            }
        });
    }

    // {"c":203,"o":"79","p":{"delId":"1693121665506567177","targetId":"1693121665506567173"}}
    // {"c":203,"s":0,"d":"{\"res\":\"suc\",\"targetId\":\"1693121665506567173\",\"armyId\":10002}","o":"79"}
    public async merge2Units(srcUnit: Unit, targetUnit: Unit): Promise<void> {
        const { authData } = this.state;
        if (!authData) throw Error('no authData');

        const r = await this.wsRPC(GAME_WS_COMMANDS.MERGE_2_UNITS, {
            delId: srcUnit.id,
            targetId: targetUnit.id,
        });

        if (r.res !== 'suc') {
            throw Error(`units not merged: ${js(r)}; src=${js(srcUnit)}; dst=${js(targetUnit)}`);
        }

        authData.armys.forEach((unit: Unit) => {
            if (unit.id === r.targetId) {
                unit.armyId = r.armyId;
            }
        });
    }

    // {"c":420,"o":"159","p":{"pveId":101,"armyList":["1693121665506567173"],"areaId":805,"heroList":[],"trapList":[]}}
    // {"c":420,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":1000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"battle\":{\"result\":1,\"ver\":1,\"process\":[{\"val\":1.0,\"selfVal\":0.0,\"t\":4,\"tl\":0,\"source\":\"0\"},{\"val\":2.0,\"selfVal\":0.0,\"t\":1,\"tl\":0,\"source\":\"1693121665506567173\"},{\"val\":2.0,\"selfVal\":0.0,\"t\":1,\"tl\":0,\"source\":\"1\"},{\"val\":7.0,\"selfVal\":0.0,\"t\":2,\"tl\":1800,\"actType\":2,\"source\":\"1693121665506567173\",\"target\":\"1\"}],\"attacker\":{\"uid\":316949168729,\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":1,\"dead\":0},\"players\":[{\"heroList\":[],\"uid\":316949168729,\"traps\":[],\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":1,\"dead\":0},\"buffs\":[],\"attackPointNum\":1,\"armyEquips\":[{\"itemId\":400002,\"pos\":1,\"armyType\":101},{\"itemId\":400001,\"pos\":0,\"armyType\":101},{\"itemId\":400004,\"pos\":1,\"armyType\":201},{\"itemId\":400005,\"pos\":0,\"armyType\":301},{\"itemId\":400003,\"pos\":0,\"armyType\":201},{\"itemId\":400006,\"pos\":1,\"armyType\":301}]}],\"buffs\":[],\"units\":[{\"uid\":316949168729,\"maxShield\":0.0,\"armyId\":10004,\"maxPower\":28.0,\"uuid\":\"1693121665506567173\",\"isDead\":0,\"uuids\":[{\"uuid\":\"1693121665506567173\",\"isDead\":0}]}],\"attackPointNum\":1},\"reportComparison\":1,\"fightType\":1,\"defender\":{\"uid\":0,\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":0,\"dead\":1},\"players\":[{\"heroList\":[],\"uid\":0,\"traps\":[],\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":0,\"dead\":1},\"buffs\":[],\"attackPointNum\":1,\"armyEquips\":[]}],\"buffs\":[],\"units\":[{\"uid\":0,\"maxShield\":0.0,\"armyId\":10001,\"maxPower\":5.0,\"uuid\":\"1\",\"isDead\":1,\"uuids\":[{\"uuid\":\"1\",\"isDead\":1}]}],\"attackPointNum\":1}},\"energy\":30}","o":"159"}
    public async fightForBaseMapArea(baseMapAreaId: number, baseMapAreaPveId: number, units: Unit[]): Promise<boolean> {
        const { state, reporter } = this;

        reporter(`fighting for base map area: ${baseMapAreaId} stage: ${baseMapAreaPveId}`);

        const armyList: string[] = units.map(u => u.id);
        const heroList: number[] = [];
        const trapList: [] = [];

        const r = await this.wsRPC(GAME_WS_COMMANDS.FIGHT_FOR_BASE_MAP_AREA, {
            pveId: baseMapAreaPveId,
            armyList,
            areaId: baseMapAreaId,
            heroList,
            trapList,
        });

        if (!r.battle) {
            throw Error(`failed to fight for base map area id=${baseMapAreaId} stage=${baseMapAreaPveId}: ${js(r)}`);
        }

        state.resources = { ...(state.resources || {}), ...r.reward.resource };

        return Boolean(r.battle.result === 1);
    }

    // {"c":117,"o":"87","p":{"id":805}}
    // {"c":117,"s":0,"d":"{\"unlockArea\":1}","o":"87"}
    public async buyBaseMapArea(baseMapAreaId: number): Promise<void> {
        const { reporter } = this;

        reporter(`buying base map area: ${baseMapAreaId}`);

        const r = await this.wsRPC(GAME_WS_COMMANDS.BUY_BASE_MAP_AREA, {
            id: baseMapAreaId,
        });

        if (r.unlockArea !== 1) {
            throw Error(`buying failed: ${js(r)}`);
        }
    }

    // {"c":828,"o":"99","p":{"type":1,"itemid":"10004"}}
    // {"c":828,"s":0,"d":"{\"result\":\"success\"}","o":"99"}
    // {"c":823,"o":"148","p":{"armyid":10004}}
    // {"c":823,"s":0,"d":"{\"result\":\"success\"}","o":"148"}
    public async claimBonusUnit(armyId: string): Promise<void> {
        const { reporter } = this;

        if (this.state.mutex.armyTipClaim[armyId]) return;
        this.state.mutex.armyTipClaim[armyId] = true;

        reporter(`claiming extra unit armyId=${armyId}`);

        const r1 = await this.wsRPC(828, { type: 1, itemid: armyId });

        // if (r1.result !== 'success') {
        //     delete this.state.mutex.armyTipClaim[armyId];
        //     throw Error(`r1: extra unit armyId=${armyId} not claimed: ${js(r1)}`);
        // }

        const r2 = await this.wsRPC(823, { armyid: armyId });

        // if (r2.result !== 'success') {
        //     delete this.state.mutex.armyTipClaim[armyId];
        //     throw Error(`r2: extra unit armyId=${armyId} not claimed: ${js(r2)}`);
        // }

        delete this.state.mutex.armyTipClaim[armyId];
        reporter(`extra unit armyId=${armyId} claimed?`);
    }

    // {"c":309,"o":"238","p":{"taskId":3}}
    // {"c":309,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":2000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"addStage\":0}","o":"238"}
    public async claimTreasureTask(taskId: number): Promise<void> {
        const { reporter, state } = this;

        if (this.state.mutex.treasureTaskClaim[taskId]) return;
        this.state.mutex.treasureTaskClaim[taskId] = true;

        reporter(`claiming treasure task id=${taskId}`);

        const r = await this.wsRPC(GAME_WS_COMMANDS.CLAIM_TREASURE_TASK, { taskId });

        delete this.state.mutex.treasureTaskClaim[taskId];

        if (r.reward) {
            reporter(`treasure task id=${taskId} claimed`);
            state.resources = { ...(state.resources || {}), ...r.reward.resource };
        } else {
            throw Error(`treasure task id=${taskId} not claimed: ${js(r)}`);
        }
    }

    // {"c":100,"o":"390","p":{"x":18,"y":26,"buildingId":1701}}
    // {"c":100,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":1601746700,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":18,\"y\":26,\"proCount\":0.0,\"state\":1,\"id\":\"1693175094597739528\",\"proTime\":1.60174671E9,\"proLastTime\":0.0}}","o":"390"}
    public async build(buildingId: number, pos: { x:number, y:number }): Promise<void> {
        const r = await this.wsRPC(GAME_WS_COMMANDS.BUILD, {
            buildingId,
            ...pos,
        });

        if (!r.building) {
            throw Error(`build failed: ${js(r)}`);
        }

        this.reporter(`successfully built: id=${buildingId} x=${pos.x} y=${pos.y}`);
    }

    protected async subscribeToAllNotifications(): Promise<void> {
        const { reporter, state } = this;
        const { authData } = state;

        if (!authData) throw Error('no authData');

        // {"c":10201,"s":0,"d":"{\"warehouseId\":\"0\",\"bx\":24,\"armyId\":10003,\"by\":24,\"x\":23,\"y\":23,\"id\":\"1693191885520725001\",\"state\":2,\"march\":0}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.UNIT_DELTA, async data => {
            for (let i = 0; i < authData.armys.length; ++i) {
                const unit: Unit = authData.armys[i];
                if (unit.id === data.id) {
                    authData.armys[i] = data;
                }
            }
        });

        // {"c":10202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":21,\"y\":27,\"id\":\"1693121665506567177\",\"state\":0,\"march\":0}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.UNIT_REMOVED, async data => {
            authData.armys = authData.armys.filter((unit: Unit) => unit.id !== data.id);
        });

        // {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":22,\"y\":28,\"li\":[]},{\"im\":true,\"x\":13,\"y\":23,\"li\":[{\"t\":2,\"i\":10004}]}]}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.BASE_TILES_DELTA, async data => {
            data.data.forEach((changedTile: BaseTile) => {
                let added: boolean = false;

                authData.points.forEach((tile: BaseTile) => {
                    if (tile.x !== changedTile.x) return;
                    if (tile.y !== changedTile.y) return;

                    tile.im = changedTile.im;
                    tile.li = changedTile.li;

                    added = true;
                });

                if (!added) {
                    authData.points.push(changedTile);
                }
            });
        });

        // {"c":10012,"s":0,"d":"{\"power\":\"516.0\"}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.POWER_DELTA, async data => {
            authData.star = Number(data.power);
        });

        // {"c":10709,"s":0,"d":"{\"shareTips\":{\"armyTips\":[\"99999\"],\"buildingTips\":[\"1704\",\"1043\"]}}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.NEW_UNIT_OR_BUILDING_UNLOCKED, async data => {
            for (let i = 0; i < data.shareTips.armyTips.length; ++i) {
                const armyId = data.shareTips.armyTips[i];
                await this.claimBonusUnit(armyId);
            }
        });

        // {"c":10124,"s":0,"d":"{\"treasureTasks\":[{\"num\":1.0,\"state\":1,\"taskId\":3}],\"isUpdate\":1}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.TREASURE_TASKS_UPDATE, async data => {
            for (let i = 0; i < data.treasureTasks.length; ++i) {
                const { state, taskId } = data.treasureTasks[i];

                // state 0 - not finished
                // state 1 - can be claimed
                // state 2 - claimed

                if (state === 1) {
                    await this.claimTreasureTask(taskId);
                }
            }
        });

        // {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":800.0}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.RESOURCES_UPDATE, async data => {
            state.resources = { ...(state.resources || {}), ...data };
        });

        // {"c":10101,"s":0,"d":"{\"broken\":0,\"proStartTime\":1601743515,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":16,\"y\":20,\"proCount\":0.0,\"state\":1,\"id\":\"1693121665103913992\",\"proTime\":1.601743525E9,\"proLastTime\":10.0}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.BUILDING_UPDATE, async data => {
            this.applyBuildingDelta(data);
        });

        // {"c":10041,"s":0,"d":"{\"level\":2,\"exp\":110.0}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.LEVEL_EXP_UPDATE, async data => {
            const oldLevel = authData.level;

            if (oldLevel != data.level) {
                reporter(`level up: ${oldLevel} -> ${data.level}`);
            }

            authData.level = data.level;
            authData.exp = data.exp;
        });

        // {"c":10104,"s":0,"d":"{\"areaId\":705}","o":null}

        this.wsSetCallbackByCommandId(GAME_WS_COMMANDS.NEW_AREA_CLAIMED, async data => {
            authData.areas.push(data.areaId);
        });

        // {"c":10203,"s":0,"d":"{\"armyNum\":5,\"armyId\":10003,\"overdueTime\":0}","o":null}

        // received units in backpack

        // {"c":10401,"s":0,"d":"{\"itemId\":300001,\"amount\":10}","o":null}

        // received items
    }
}
