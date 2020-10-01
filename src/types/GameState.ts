import WebSocket from 'ws';

import { DiscordBot } from 'DiscordBot';

export type WsCallbackKeepMe = true | false | void;
export type WsCallback = (bot: DiscordBot, payload: any) => Promise<WsCallbackKeepMe>;

export interface GameState {
    connected: boolean;
    connecting: boolean;
    reporter: Function;
    accountAuthCode?: string;
    accountAliSAFDataHash?: string;
    accountAliSAFDataDetail?: string;
    userAgent?: string;
    clientVersion?: string;
    serverInfo?: {
        serverId: number; // 694
        serverInfoToken: string; // Njk0L...LCw=
        g123Url: string; // wss://knight-cn-tencent-520.rivergame.net/s694

        msg?: string;
        pfuid?: string; // GGPHTIAA
        country?: string;
        log?: string; // sslChatToken:0|queryDeviceMapping:169|get new server info :169|
        stop_reason?: string;
        server_status?: number; // 1 - ok
        appUrl?: string; // wss://server-knight-s80.rivergame.net/s694
        stop_end_time?: number; // 0
        url?: string; // wss://knight-cn-tencent-520.rivergame.net/s694
        ruUrl?: string; // wss://knight-cn-tencent-520.rivergame.net/s694
        badDev?: string; // com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam
        globalUrl?: string; // wss://knight-cn-tencent-520.rivergame.net/s694
        t?: number; // 169
        stop_start_time?: number; // 0
        v?: string; // 1.0.42
        now?: number; // 1600990046
        showType?: number; // 0
        region?: string; // cn-beijing
        wssLines?: string; // knight-cn-me.rivergame.net|wss://knigh...
        status?: number; // 0
        wssLinesCN?: string; // serverlist-knight.rivergame.net|wss://ser...
    };
    authData?: {
        [key: string]: any;
    };
    gameWs?: WebSocket;
    gameWsNextPacketIndex: number;
    gameWsCallbacks?: {
        [key: string]: WsCallback[] | undefined,
    };
    gameWsPushCallback: (
        packet: {[key: string]: any},
        callback: WsCallback,
    ) => void;
    gameWsSend: (
        packet: {[key: string]: any},
        onResponse?: WsCallback,
        onTimeout?: (bot: DiscordBot) => Promise<any>,
    ) => NodeJS.Timeout | null;
    gameWsPingItv?: NodeJS.Timeout;
    gameWsInactivityTimeout?: NodeJS.Timeout;
}
