import md5 from 'md5';
import WebSocket from 'ws';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Agent } from 'https';

import { DiscordBot } from 'DiscordBot';
import randomString from 'modules/randomString';
import * as GAME_WS_FIELDS from 'constants/gameWsFields';
import * as GAME_WS_COMMANDS from 'constants/gameWsCommands';
import { WsCallback } from 'types/GameState';
import disconnectFromGameWs from 'gameCommands/disconnectFromGameWs';

const DEFAULT_ALISAFDATA_DETAIL = '#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==';
const DEFAULT_ALISAFDATA_DETAIL_PREFIX = '134';

export default function(
    bot: DiscordBot,
    options: {[key: string]: any} = {},
): Promise<WebSocket> { return new Promise((resolve, reject) => {
    if (!bot.state) throw Error('no state');

    const { config, state } = bot;
    const { game } = state;
    const reporter = game.reporter;

    if (!game.accountAuthCode) throw Error('no account code');
    if (!game.clientVersion) throw Error('no client version');
    if (!game.serverInfo) throw Error('no server info');

    const userAgent = game.userAgent || config.browser.userAgent;
    const wsUrl = game.serverInfo.g123Url;

    const wsOptions: WebSocket.ClientOptions = {
        origin: bot.config.game.urls.gameWs_origin,
        headers: {
            'User-Agent': userAgent,
        },
    };

    if (bot.config.proxy) {
        wsOptions.agent = new SocksProxyAgent(bot.config.proxy.socks5[0]) as unknown as Agent;
    }

    const ws = new WebSocket(wsUrl, wsOptions);

    game.gameWs = ws;
    game.gameWsNextPacketIndex = (options.switchServer ? game.gameWsNextPacketIndex : 0) || 0;
    game.gameWsCallbacks = {};

    game.gameWsPushCallback = (packet, callback) => {
        if (!game.gameWsCallbacks) throw Error('no gameWsCallbacks');

        const command = packet[GAME_WS_FIELDS.COMMAND];

        game.gameWsCallbacks[command] = game.gameWsCallbacks[command] || [];
        game.gameWsCallbacks[command]?.push(callback);
    };

    game.gameWsSend = (packet, onResponse, onTimeout) => {
        let tmt = onResponse ? setTimeout(() => {
            reporter('ws packet timeout 10s');
            onTimeout ? onTimeout(bot) : disconnectFromGameWs(bot);
        }, 10000) : null;

        onResponse && game.gameWsPushCallback(packet, async (bot, payload) => {
            tmt && clearTimeout(tmt);
            tmt = null;
            return await onResponse(bot, payload);
        });

        if (config.game.printWsPackets) {
            console.log('🔸 out:', JSON.stringify(packet));
        }

        ws.send(JSON.stringify(packet));

        return tmt;
    };

    const aliSAFData = {
        // https://g.alicdn.com/AWSC/WebUMID/1.85.0/um.js
        // hash: '', awsc.um.init({appName:"saf-aliyun-com"}).tn
        // https://g.alicdn.com/AWSC/uab/1.137.1/collina.js
        // detail: '', awsc.uab.getUA()
        hash: game.accountAliSAFDataHash || randomString(88, randomString.alpha.azAZ09_),
        detail: game.accountAliSAFDataDetail || ((game.serverInfo.t || DEFAULT_ALISAFDATA_DETAIL_PREFIX) + DEFAULT_ALISAFDATA_DETAIL),
        fphash: md5(game.accountAuthCode + ':' + userAgent),
    };

    ws.on('erorr', () => {
        throw Error('WS communication error');
    });

    ws.on('open', () => {
        if (!game.gameWsCallbacks) throw Error('no gameWsCallbacks');
        if (!game.serverInfo) throw Error('no server info');

        reporter(`connected to ${wsUrl}`);

        const packet = {
            [GAME_WS_FIELDS.COMMAND]: GAME_WS_COMMANDS.AUTH,
            [GAME_WS_FIELDS.PACKET_INDEX]: String(game.gameWsNextPacketIndex++),
            [GAME_WS_FIELDS.OUTCOMING_PAYLOAD]: {
                aliSAFData,
                token: game.accountAuthCode,
                serverId: Number(game.serverInfo.serverId),
                serverInfoToken: game.serverInfo.serverInfoToken,
                appVersion: game.clientVersion,
                platformVer: game.clientVersion,
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
            } as {[key: string]: any},
        };

        if (options.switchServer) {
            packet[GAME_WS_FIELDS.OUTCOMING_PAYLOAD].changeServer = 1;
        }

        game.gameWsSend(packet, async (bot, payload) => {
            game.authData = payload;
            reporter(`auth complete: ${payload.username}`);
            resolve(ws);
        });
    });

    ws.on('message', async (data: string) => {
        if (config.game.printWsPackets) {
            console.log('🔸 in:', data);
        }

        const parsedData = JSON.parse(data);

        try {
            parsedData[GAME_WS_FIELDS.INCOMING_DATA] =
                JSON.parse(parsedData[GAME_WS_FIELDS.INCOMING_DATA]);
        } catch {}

        await applyCallbacks(bot, parsedData);
    });
}); }

async function applyCallbacks(bot: DiscordBot, parsedData: any) {
    const game = bot.state?.game;
    if (!game?.gameWsCallbacks) throw Error('no gameWsCallbacks');

    const command = parsedData[GAME_WS_FIELDS.COMMAND];
    const cbs = game.gameWsCallbacks[command];

    if (!cbs) return;

    const newCbs: WsCallback[] = [];

    for (let i = 0; i < cbs.length; ++i) {
        const cb = cbs[i];

        const keepMe = await cb(bot, parsedData[GAME_WS_FIELDS.INCOMING_DATA]);

        if (keepMe) {
            newCbs.push(cb);
        }
    }

    if (newCbs.length) {
        game.gameWsCallbacks[command] = newCbs;
    } else {
        delete game.gameWsCallbacks[command];
    }
}
