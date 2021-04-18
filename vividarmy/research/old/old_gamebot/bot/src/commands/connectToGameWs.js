const md5 = require('md5');
const WebSocket = require('ws');
const SocksProxyAgent = require('socks-proxy-agent');

const log = require('modules/log').setName('connectToGameWs');
const cws = require('constants/ws-game');

module.exports = (ctx, { account, switchServer }) => new Promise((resolve, reject) => {
    log('start');

    const userAgent = account.data.userAgent || ctx.conf.browser.userAgent;

    const ws = new WebSocket(account.data.serverInfo.g123Url, {
        agent: new SocksProxyAgent(ctx.conf.socks5.g123),
        origin: ctx.conf.vividarmy.gameWs_origin,
        headers: {
            'User-Agent': userAgent,
        },
    });

    ctx.gameWs = ws;
    ctx.gameWsNextPacketIndex = switchServer ? ctx.gameWsNextPacketIndex : 0;
    ctx.gameWsReceived = [];
    ctx.gameWsCallbacksByIndex = {};
    ctx.gameWsCallbacksByCommand = {};

    const aliSAFData = {
        // https://g.alicdn.com/AWSC/WebUMID/1.85.0/um.js
        // hash: '', awsc.um.init({appName:"saf-aliyun-com"}).tn
        // https://g.alicdn.com/AWSC/uab/1.137.1/collina.js
        // detail: '', awsc.uab.getUA()
        hash: account.data.aliSAFDataHash,
        detail: account.data.aliSAFDataDetail,
        fphash: md5(account.data.gameData.code + ':' + userAgent),
    };

    ws.on('open', () => {
        log('connected to', account.data.serverInfo.serverId);

        const packet = {
            [cws.WS_GAME_OUT_COMMAND]: cws.WS_GAME_COMMAND_AUTH,
            [cws.WS_GAME_OUT_PACKET_INDEX]: String(ctx.gameWsNextPacketIndex++),
            [cws.WS_GAME_OUT_PAYLOAD]: {
                aliSAFData,
                token: account.data.gameData.code,
                serverId: Number(account.data.serverInfo.serverId),
                serverInfoToken: account.data.serverInfo.serverInfoToken,
                appVersion: account.data.clientVersion.value,
                platformVer: account.data.clientVersion.value,
                country: 'JP',
                lang: 'ja',
                nationalFlag: 114,
                ip: '0',
                pf: switchServer ? '' : 'g123',
                platform: 'G123',
                channel: 'g123_undefined',
                gaid: '',
                itemId: '',
                g123test: 0,
            },
        };

        if (switchServer) {
            packet[cws.WS_GAME_OUT_PAYLOAD].changeServer = 1;
        }

        ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_AUTH] = ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_AUTH] || [];
        ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_AUTH].push((ctx, data, payload) => {
            account.data.gameData.authData = payload;
            log('authed as', account.data.gameData.userId);
            resolve(ws);
        });

        ws.send(JSON.stringify(packet));
    });

    ws.on('message', data => {
        console.log('🔸 data:', data);

        data = JSON.parse(data);

        try {
            data[cws.WS_GAME_IN_PAYLOAD] = JSON.parse(data[cws.WS_GAME_IN_PAYLOAD]);
        } catch {}

        ctx.gameWsReceived.push(data);

        applyCallbacksByIndex(ctx, data)
            .then(() => applyCallbacksByCommand(ctx, data));
    });
});

const applyCallbacksByIndex = async function(ctx, data) {
    const index = data[cws.WS_GAME_IN_PACKET_INDEX];
    const payload = data[cws.WS_GAME_IN_PAYLOAD];
    const cbs = ctx.gameWsCallbacksByIndex[index];

    if (!cbs) return;

    if (!Array.isArray(cbs)) {
        throw Error(`applyCallbacksByIndex: expect array, but got ${typeof cbs}`);
    }

    const newCbs = [];

    for (let i = 0; i < cbs.length; ++i) {
        const cb = cbs[i];

        const r = await cb(ctx, data, payload);

        if (r) {
            newCbs.push(cb);
        }
    }

    if (newCbs.length) {
        ctx.gameWsCallbacksByIndex[index] = newCbs;
    } else {
        delete ctx.gameWsCallbacksByIndex[index];
    }
};

const applyCallbacksByCommand = async function(ctx, data) {
    const command = data[cws.WS_GAME_IN_COMMAND];
    const payload = data[cws.WS_GAME_IN_PAYLOAD];
    const cbs = ctx.gameWsCallbacksByCommand[command];

    if (!cbs) return;

    if (!Array.isArray(cbs)) {
        throw Error(`applyCallbacksByCommand: expect array, but got ${typeof cbs}`);
    }

    const newCbs = [];

    for (let i = 0; i < cbs.length; ++i) {
        const cb = cbs[i];

        const r = await cb(ctx, data, payload);

        if (r) {
            newCbs.push(cb);
        }
    }

    if (newCbs.length) {
        ctx.gameWsCallbacksByCommand[command] = newCbs;
    } else {
        delete ctx.gameWsCallbacksByCommand[command];
    }
};
