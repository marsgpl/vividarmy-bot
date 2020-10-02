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

const DEFAULT_ALISAFDATA_DETAIL = '#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==';
const DEFAULT_ALISAFDATA_DETAIL_PREFIX = '134';

type GameWsCallbackKeepMe = boolean | void;

export type GameWsCallback = (data: any) => Promise<GameWsCallbackKeepMe>;

export interface GameWsOutgoingPacket {
    [GAME_WS_FIELDS.COMMAND]: number;
    [GAME_WS_FIELDS.PACKET_INDEX]: string;
    [GAME_WS_FIELDS.OUTGOING_PAYLOAD]: {
        [key: string]: any;
    };
}

export interface GameWsIncomingPacket {
    [GAME_WS_FIELDS.COMMAND]: number;
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
    gameWs?: WebSocket;
    gameWsNextPacketIndex: number;
    gameWsCallbacks: {
        [key: string]: GameWsCallback[],
    };
    gameWsPingInterval?: NodeJS.Timeout;
    gameWsInactivityTimeout?: NodeJS.Timeout;
    gameWsPushCallback: (
        packet: GameWsOutgoingPacket,
        callback: GameWsCallback,
    ) => void;
    gameWsSend: (
        packet: GameWsOutgoingPacket,
        onResponse?: GameWsCallback,
        onTimeout?: () => Promise<void>,
    ) => void;
    gameWsRPC: (
        command: number,
        payload: {[key: string]: any},
        options?: {[key: string]: any},
    ) => Promise<any>;
}

interface GameBotOptions {
    userAgent: string;
    cookieJar: CookieJar;
    gp_token: string;
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

        const self = this;

        const gameWsPushCallback = (
            packet: GameWsOutgoingPacket,
            callback: GameWsCallback,
        ): void => {
            const { state } = self;
            const command = packet[GAME_WS_FIELDS.COMMAND];

            state.gameWsCallbacks[command] = state.gameWsCallbacks[command] || [];
            state.gameWsCallbacks[command].push(callback);
        };

        const gameWsSend = (
            packet: GameWsOutgoingPacket,
            onResponse?: GameWsCallback,
            onTimeout?: () => Promise<void>,
        ): void => {
            const { state, reporter } = self;

            if (!state.gameWs) throw Error('no gameWs');

            if (onResponse) {
                const tmt = setTimeout(() => {
                    reporter('ws packet timeout 30s');
                    onTimeout ? onTimeout() : self.disconnectFromGameWs();
                }, 30 * 1000);

                state.gameWsPushCallback(packet, async data => {
                    tmt && clearTimeout(tmt);
                    return onResponse(data);
                });
            }

            const packetFormatted = JSON.stringify(packet);

            if (config.game.printWsPackets) {
                console.log('🔸 out:', packetFormatted);
            }

            state.gameWs.send(packetFormatted);
        };

        const gameWsRPC = (
            command: number,
            payload: {[key: string]: any},
            options?: {[key: string]: any},
        ): Promise<any> => new Promise(async (resolve, reject) => {
            const { state, reporter } = this;

            await this.connectToGameWs();

            if (options?.report) {
                reporter(`${command} => ${JSON.stringify(payload)}`);
            }

            state.gameWsSend({
                [GAME_WS_FIELDS.COMMAND]: command,
                [GAME_WS_FIELDS.PACKET_INDEX]: String(state.gameWsNextPacketIndex++),
                [GAME_WS_FIELDS.OUTGOING_PAYLOAD]: payload,
            }, async data => {
                resolve(data);
            });
        });

        this.state = {
            connected: false,
            connecting: false,
            gameWsNextPacketIndex: 0,
            gameWsCallbacks: {},
            gameWsPushCallback,
            gameWsSend,
            gameWsRPC,
        };

        this.cookieJar = options.cookieJar;

        this.browser = new Browser({
            userAgent: options.userAgent,
            cookieJar: this.cookieJar,
            socks5: config.proxy.required ? config.proxy.socks5?.[0] : undefined,
        });
    }

    public async getPlayerInfo(options: { playerId: number }): Promise<any> {
        return this.state.gameWsRPC(GAME_WS_COMMANDS.GET_PLAYER_INFO, {
            uid: String(options.playerId),
        });
    }

    public async getPlayerPosInfo(options: { playerId: number }): Promise<any> {
        return this.state.gameWsRPC(GAME_WS_COMMANDS.GET_PLAYER_POS_INFO, {
            targetId: String(options.playerId),
        });
    }

    public async getTopPlayers(options: { offsetFrom: number, offsetTo: number, report?: boolean }): Promise<any> {
        return this.state.gameWsRPC(GAME_WS_COMMANDS.GET_TOP_PLAYERS, {
            start: options.offsetFrom,
            end: options.offsetTo,
        }, {
            report: options.report,
        });
    }

    protected async disconnectFromGameWs(): Promise<void> {
        const { state, reporter } = this;

        if (!state.connected) return;
        if (!state.gameWs) return;

        state.gameWs.close();

        state.gameWsPingInterval && clearInterval(state.gameWsPingInterval);
        state.gameWsInactivityTimeout && clearTimeout(state.gameWsInactivityTimeout);

        delete state.gameWsPingInterval;
        delete state.gameWsInactivityTimeout;
        delete state.session;
        delete state.clientVersion;
        delete state.serverInfo;
        delete state.authData;
        delete state.gameWs;

        state.connected = false;

        reporter('disconnected from game');
    }

    protected async connectToGameWs(): Promise<void> {
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
            await this.openGameWs();
        } catch (error) {
            state.connecting = false;
            throw error;
        }

        state.connecting = false;
        state.connected = true;

        this.startPings();
        this.startInactivityTimeout();
    }

    protected startInactivityTimeout(): void {
        const { state, reporter } = this;

        state.gameWsInactivityTimeout && clearTimeout(state.gameWsInactivityTimeout);

        state.gameWsInactivityTimeout = setTimeout(() => {
            reporter('inactivity 10 minutes');
            this.disconnectFromGameWs();
        }, 10 * 60 * 1000);
    }

    protected startPings(): void {
        const { state } = this;

        state.gameWsPingInterval && clearInterval(state.gameWsPingInterval);

        state.gameWsPingInterval = setInterval(() => {
            if (!state.connected) return;
            if (!state.gameWs) return;

            state.gameWsSend({
                [GAME_WS_FIELDS.COMMAND]: GAME_WS_COMMANDS.PING,
                [GAME_WS_FIELDS.PACKET_INDEX]: String(state.gameWsNextPacketIndex++),
                [GAME_WS_FIELDS.OUTGOING_PAYLOAD]: {},
            });
        }, 11 * 1000);
    }

    protected async openGameWs(options?: { switchServer?: boolean }): Promise<void> { return new Promise((resolve, reject) => {
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
            hash: randomString(88, randomString.alpha.azAZ09_),
            detail: ((state.serverInfo.t || DEFAULT_ALISAFDATA_DETAIL_PREFIX) + DEFAULT_ALISAFDATA_DETAIL),
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

        state.gameWs = ws;
        state.gameWsNextPacketIndex = (options?.switchServer ? state.gameWsNextPacketIndex : 0) || 0;
        state.gameWsCallbacks = {};

        ws.on('erorr', () => {
            throw Error('WS communication error');
        });

        ws.on('open', () => {
            reporter(`connected to ${wsUrl}`);

            if (!state.session) throw Error('no session');
            if (!state.serverInfo) throw Error('no serverInfo');
            if (!state.clientVersion) throw Error('no clientVersion');

            const packet: GameWsOutgoingPacket = {
                [GAME_WS_FIELDS.COMMAND]: GAME_WS_COMMANDS.AUTH,
                [GAME_WS_FIELDS.PACKET_INDEX]: String(state.gameWsNextPacketIndex++),
                [GAME_WS_FIELDS.OUTGOING_PAYLOAD]: {
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
                },
            };

            if (options?.switchServer) {
                packet[GAME_WS_FIELDS.OUTGOING_PAYLOAD].changeServer = 1;
            }

            state.gameWsSend(packet, async data => {
                state.authData = data;
                reporter(`auth complete: ${data.username}`);
                resolve();
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

            await self.applyCallbacks(packet);
        });
    }); }

    protected async applyCallbacks(packet: GameWsIncomingPacket): Promise<void> {
        const { state } = this;

        const command = packet[GAME_WS_FIELDS.COMMAND];
        const cbs = state.gameWsCallbacks[command];

        if (!cbs) return;

        const newCbs: GameWsCallback[] = [];

        for (let i = 0; i < cbs.length; ++i) {
            const cb = cbs[i];
            const keepMe = await cb(packet[GAME_WS_FIELDS.INCOMING_DATA]);

            if (keepMe) {
                newCbs.push(cb);
            }
        }

        if (newCbs.length) {
            state.gameWsCallbacks[command] = newCbs;
        } else {
            delete state.gameWsCallbacks[command];
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

        const r = await this.browser.get(url, {}, {
            referer: config.game.urls.getServerInfo_referer,
            origin: config.game.urls.getServerInfo_origin,
        });

        const serverInfo = JSON.parse(r.body);

        const { serverId, serverInfoToken, g123Url, region } = serverInfo;

        if (!serverId || !serverInfoToken || !g123Url) {
            throw Error(`getServerInfo: invalid: ${r.body}`);
        }

        const { server_status, stop_start_time, stop_end_time, msg, stop_reason } = serverInfo;

        if (server_status !== 1 || stop_reason || stop_start_time) {
            throw Error(`maintenance: ${stop_reason}; ${msg}; end time: ${stop_end_time}`);
        }

        state.serverInfo = serverInfo;

        reporter(`server: ${serverId} ${region || 'no region'}`);
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

        const r = await this.browser.get(url, {}, {
            referer: config.game.urls.shell,
        });

        const session = JSON.parse(r.body);

        if (!session.code) {
            throw Error(`getSession: invalid: ${r.body}`);
        }

        state.session = session;

        reporter(`is new user: ${session.isPlatformNewUser}`);
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
    }
}
