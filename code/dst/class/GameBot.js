var _this = this;
var colors_1 = require('colors');
var md5_1 = require('md5');
var ws_1 = require('ws');
var socks_proxy_agent_1 = require('socks-proxy-agent');
var CookieJar_1 = require('modules/CookieJar');
var Browser_1 = require('modules/Browser');
var crop_1 = require('modules/crop');
var randomString_1 = require('modules/randomString');
var switchServerAccount_1 = require('gameCommands/switchServerAccount');
var asyncForeach_1 = require('modules/asyncForeach');
var deleteAccount_1 = require('gameCommands/deleteAccount');
var claimTreasureTask_1 = require('gameCommands/claimTreasureTask');
var js = JSON.stringify;
var DEFAULT_WS_RPC_TIMEOUT_MS = 30 * 1000; // 30s
var DEFAULT_WS_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10m
var WS_PING_INTERVAL_MS = 10300; // 10s 300ms
var DEFAULT_WS_CONNECT_TIMEOUT_MS = 10000; // 10s
var WS_FIELD_COMMAND_ID = 'c';
var WS_FIELD_PACKET_INDEX = 'o';
var WS_FIELD_OUTGOING_PAYLOAD = 'p';
var WS_FIELD_INCOMING_DATA = 'd';
var DEFAULT_ALISAFDATA_DETAIL = '#7NLIMJXwXGf/ctRcTggSoJ0D3QROwKOlAOzBtZ26EXkEHKhYtSUkA7UgvaRgn6KcNcaKw+sGr3qlaQ2dbnqPPl1tgNze2lR3CRwFBuJU+JdqKXL3ZtWwTq1qijRmNyd3OOH8qkuJ+Jd8qcHAZXnw+cy8qqK7OO96dE3gXJCXv2/5Utf35LLsJHpzZiOdIQOQf60DS4hySCx9fzd8GGXEgKvqzwKmPYvDJc8fMOPFJcGlEKJ8T/BVLSW9WjlgqkUAWOC/4CBbzY2Y8UHggSm3rv20jgfXytYMl/EO6GRQXn/nrD9wSAJOb4InBPg7ROtUVoyWyJS/pToU6Sdf8op6d87oygjhsHCDAOxVtQP67QH647Fs5AsThvzsKvTdXgLGwCXXA1aAhvJVTXDVIjariuT47UsZ94G4VveZLdWOTsNxu5BNOTbwDQdf4GB8gzqg+rUH/7c5rS31nUiXwFxGotqW9nCvmQpcVT6OGvvYSwJla4DnbZm8YPCKxCGQcW+jkyJA5yojt74U1fG4clrTzN9sVltLRAdG+rTbuY/PZKRZ+VkMfG5q7mOqHjsparfWqLTmid/4Rx7WSQ8qxca6J34fud6o6MaZrwr/ZfF/86bCUbtflHK1axATHhdi33aEuf5LPcR/LD6p2E6LO/yC7I3k4TPIeQdGAL+wgAOVEoJ8EeDlwlPCU6KjApAQwMTcG8x5p43QtH25JUxOR1Xxkj7sF6TJI3HkXppBB9Y6/nuEdZ2aUXGs5U4qPfmcKNvqGeK7YEWtTuxr5jNSzfw25WIyGxC/j5kmtEKGX+w9mqjlatros9HUMougxz5Z/a6zIX==';
var DEFAULT_ALISAFDATA_DETAIL_PREFIX = '134';
var GameBot = (function () {
    function GameBot(config, options) {
        this.reporter = function (msg) { return console.log(msg); };
        this.async = init();
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
            wsConnectSemaphoreCallbacks: []
        };
    }
    Object.defineProperty(GameBot.prototype, "cookieJar", {
        get: function () {
            if (!this._cookieJar)
                throw Error('GameBot: no cookieJar');
            return this._cookieJar;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameBot.prototype, "browser", {
        get: function () {
            if (!this._browser)
                throw Error('GameBot: no browser');
            return this._browser;
        },
        enumerable: true,
        configurable: true
    });
    GameBot.prototype.Promise = ;
    return GameBot;
})();
exports.GameBot = GameBot;
void  > {
    const: (_a = this, config = _a.config, options = _a.options, _a),
    await: this.initCookieJar(),
    this: ._browser = new Browser_1.Browser({
        userAgent: options.userAgent,
        cookieJar: this.cookieJar,
        socks5: config.proxy.required ? config.proxy.socks5 ? .[0] : undefined : 
    })
};
async;
initCookieJar();
Promise < void  > {
    const: (_b = this, config = _b.config, options = _b.options, _b),
    if: function () { } };
!options.cookieDocId || !options.cookieCollection;
return;
this._cookieJar = new CookieJar_1.CookieJar({
    storageType: CookieJar_1.CookieJarStorageType.MONGO_DB,
    storageConfig: {
        collection: options.cookieCollection,
        docId: options.cookieDocId
    }
});
await;
this.cookieJar.loadFromStorage();
if (options.gpToken.length > 0) {
    var rawCookie = this.cookieJar.buildRawCookie(config.game.gpTokenCookie.name, options.gpToken, config.game.gpTokenCookie.params);
    await;
    this.cookieJar.putRawCookiesAndSave(config.game.gpTokenCookie.params.host, [rawCookie]);
}
async;
getServerInfo();
Promise < void  > {
    const: (_c = this, reporter = _c.reporter, config = _c.config, state = _c.state, browser = _c.browser, _c),
    if: function () { } };
!state.clientVersion;
await;
this.getClientVersion();
if (!state.clientVersion)
    throw Error('no state.clientVersion');
if (!state.session)
    await;
this.getSession();
if (!state.session)
    throw Error('no state.session');
var url = config.game.urls.getServerInfo
    .replace(':ts:', String(Date.now()))
    .replace(':token:', state.session.code)
    .replace(':appVersion:', state.clientVersion.value);
var r = await, browser, get = (url, {}, {
    referer: config.game.urls.getServerInfo_referer,
    origin: config.game.urls.getServerInfo_origin
});
var serverInfo = JSON.parse(r.body), as = GameBotServerInfo;
if (!serverInfo.serverId ||
    !serverInfo.serverInfoToken ||
    !serverInfo.g123Url ||
    !serverInfo.region) {
    throw Error("fail: " + r.body);
}
if (serverInfo.now &&
    serverInfo.stop_end_time &&
    serverInfo.stop_end_time > serverInfo.now) {
    var secondsLeft = serverInfo.stop_end_time - serverInfo.now + 1;
    throw Error("maintenance: " + js(serverInfo) + "; duration: " + secondsLeft + "s");
}
state.serverInfo = serverInfo;
reporter("server info: " + serverInfo.serverId + " " + serverInfo.region);
async;
getSession();
Promise < void  > {
    const: (_d = this, reporter = _d.reporter, config = _d.config, state = _d.state, browser = _d.browser, _d),
    const: url = config.game.urls.getSession
        .replace(':from:', encodeURIComponent(config.game.urls.shell)),
    const: r = await, browser: .get(url, {}, {
        referer: config.game.urls.shell
    }),
    const: session = JSON.parse(r.body), as: GameBotSession,
    if: function () { } };
!session.code;
{
    throw Error("fail: " + r.body);
}
state.session = session;
var gameUrl = config.game.urls.game
    .replace(':code:', session.code);
reporter("session: " + (session.isPlatformNewUser ? 'new user' : 'existing user'));
console.log("----------\n" + gameUrl + "\n----------");
async;
getClientVersion();
Promise < void  > {
    const: (_e = this, reporter = _e.reporter, config = _e.config, state = _e.state, browser = _e.browser, _e),
    if: function (config, game, checkIp, required) {
        await;
        this.checkIp();
    },
    const: url = config.game.urls.getClientVersion
        .replace(':ts:', String(Date.now())),
    const: r = await, browser: .get(url, {}, {
        referer: config.game.urls.getClientVersion_referer
    }),
    const: (_f = r.body.trim().split('|'), value = _f[0], notes = _f[1], _f),
    if: function () { } };
!value;
{
    throw Error("fail: " + r.body);
}
state.clientVersion = { value: value, notes: notes };
reporter("client version: " + value + " | " + notes);
async;
checkIp();
Promise < void  > (_g = ["ip: ", ""], _g.raw = ["ip: ", ""], ({
    const: (_h = this, reporter = _h.reporter, config = _h.config, browser = _h.browser, _h),
    const: r = await, browser: .get(config.game.checkIp.url),
    const: expected = js(config.game.checkIp.expectedAnswer),
    const: received = js(r.body),
    if: function (received) {
        if (received === void 0) { received =  !== expected; }
        throw Error("expected: " + expected + "; received: " + received);
    },
    reporter: function () { } })(_g, received.match(/\(([^\)]+)\)/) ? .[1] || '?' : ));
;
wsRPC(commandId, number, payload, GameWsOutgoingPayload);
Promise < GameWsIncomingData > {
    return: new Promise(function (resolve, reject) {
        var state = _this.state;
        var responseTimeout = setTimeout(function () {
            reject("ws rpc failed by timeout: " + DEFAULT_WS_RPC_TIMEOUT_MS + "ms");
            _this.disconnectFromWs();
        }, DEFAULT_WS_RPC_TIMEOUT_MS);
        var cb = async, data;
        {
            clearTimeout(responseTimeout);
            if (data) {
                resolve(data);
            }
            else {
                reject(data);
            }
        }
        ;
        _this.wsSend(commandId, payload).then(function (packetIndex) {
            state.wsCallbacksByPacketIndex[packetIndex] = cb;
        }).catch(reject);
    })
};
async;
wsSend(commandId, number, payload, GameWsOutgoingPayload);
Promise < string > {
    const: (_j = this, config = _j.config, state = _j.state, _j),
    await: this.connectToWs(),
    if: function () { } };
!state.ws;
throw Error('no ws');
var packetIndex = String(state.wsNextPacketIndex++);
var packet = (_k = {},
    _k[WS_FIELD_COMMAND_ID] = commandId,
    _k[WS_FIELD_PACKET_INDEX] = packetIndex,
    _k[WS_FIELD_OUTGOING_PAYLOAD] = payload,
    _k
);
var bytes = js(packet);
if (config.game.printWsPackets) {
    console.log(colors_1["default"].gray('🔸 out:'), colors_1["default"].gray(crop_1["default"](bytes, config.game.printWsPacketsMaxLength)));
}
state.ws.send(bytes);
if (commandId !== 0) {
    this.restartWsInactivityTimeout();
}
return packetIndex;
restartWsInactivityTimeout();
void {
    const: (_l = this, state = _l.state, reporter = _l.reporter, _l),
    this: .stopWsInactivityTimeout(),
    state: .wsInactivityTimeout = setTimeout(function () {
        reporter("ws inactivity: " + DEFAULT_WS_INACTIVITY_TIMEOUT_MS + "ms");
        _this.disconnectFromWs();
    }, DEFAULT_WS_INACTIVITY_TIMEOUT_MS)
};
stopWsInactivityTimeout();
void {
    const: (_m = this, state = _m.state, _m),
    state: .wsInactivityTimeout &&
        clearTimeout(state.wsInactivityTimeout),
    delete: state.wsInactivityTimeout
};
async;
connectToWs(options, GameBotWsConnectOptions = {});
Promise < void  > {
    const: (_o = this, state = _o.state, _o),
    if: function (state, wsConnected) { }, return: ,
    if: function (state, wsConnecting) {
        return await;
        this.waitForOtherThreadToConnectToWs();
    },
    state: .wsConnecting = true,
    try: {
        await: this.openWs(options)
    }, catch: function (error) {
        state.wsConnecting = false;
        throw error;
    },
    this: .startWsPings(),
    this: .restartWsInactivityTimeout(),
    this: .subscribeToAllNotifications()
};
openWs(options, GameBotWsConnectOptions);
Promise < void  > {
    return: new Promise(async(resolve, reject), {
        const: (_p = this, reporter = _p.reporter, state = _p.state, config = _p.config, _p),
        if: function (state, wsConnected) { }, throw: Error('state.wsConnected must be false'),
        if: function () { } }, !state.wsConnecting), throw: Error('state.wsConnecting must be true'),
    if: function (state, ws) { }, throw: Error('state.ws should not exist'),
    if: function () { } };
!state.clientVersion;
await;
this.getClientVersion();
if (!state.clientVersion)
    throw Error('no state.clientVersion');
if (!state.session)
    await;
this.getSession();
if (!state.session)
    throw Error('no state.session');
if (!state.serverInfo)
    await;
this.getServerInfo();
if (!state.serverInfo)
    throw Error('no state.serverInfo');
var needSocks5 = config.proxy.required;
var socks5 = config.proxy.socks5 ? .[0] : ;
if (needSocks5 && !socks5) {
    throw Error('socks5 required but missing in config');
}
var wsUrl = state.serverInfo.g123Url;
var ws = new ws_1["default"](wsUrl, {
    headers: {
        'User-Agent': this.options.userAgent
    },
    origin: config.game.urls.gameWs_origin,
    agent: (needSocks5 && socks5) ?
        new socks_proxy_agent_1.SocksProxyAgent(socks5) : as, unknown: as, Agent: undefined
});
state.ws = ws;
state.wsNextPacketIndex = (options.switchServer ? state.wsNextPacketIndex : 0) || 0;
state.wsCallbacksByCommandId = {};
state.wsCallbacksByPacketIndex = {};
var wsConnectTimeout = setTimeout(function () {
    reject("ws connect timeout: " + DEFAULT_WS_CONNECT_TIMEOUT_MS + "ms");
    _this.disconnectFromWs();
}, DEFAULT_WS_CONNECT_TIMEOUT_MS);
ws.on('erorr', function (error) {
    clearTimeout(wsConnectTimeout);
    reject("ws communication error: " + error);
});
ws.on('open', async(), (_q = ["ws connected to ", ""], _q.raw = ["ws connected to ", ""], ({
    clearTimeout: function (wsConnectTimeout) { },
    reporter: function () { } })(_q, wsUrl)));
state.wsConnected = true;
state.wsConnecting = false;
await;
this.wsAuth(options);
resolve();
await;
this.triggerWsConnectSemaphore();
;
ws.on('message', this.onWsMessage.bind(this));
;
wsAuth(options, GameBotWsConnectOptions);
Promise < void  > {
    return: new Promise(async(resolve, reject), {
        const: (_r = this, state = _r.state, reporter = _r.reporter, _r),
        if: function (state, wsAuthed) { }, throw: Error('ws already authed'),
        if: function () { } }, !state.session), throw: Error('no state.session'),
    if: function () { } };
!state.serverInfo;
throw Error('no state.serverInfo');
if (!state.clientVersion)
    throw Error('no state.clientVersion');
var aliSAFData = {
    // https://g.alicdn.com/AWSC/WebUMID/1.85.0/um.js
    // hash: '', awsc.um.init({appName:"saf-aliyun-com"}).tn
    // https://g.alicdn.com/AWSC/uab/1.137.1/collina.js
    // detail: '', awsc.uab.getUA()
    hash: this.options.aliSAFDataHash || randomString_1["default"](88, randomString_1["default"].alpha.azAZ09_),
    detail: this.options.aliSAFDataDetail || ((state.serverInfo.t || DEFAULT_ALISAFDATA_DETAIL_PREFIX) + DEFAULT_ALISAFDATA_DETAIL),
    fphash: md5_1["default"](state.session.code + ':' + this.options.userAgent)
};
var responseTimeout = setTimeout(function () {
    reject("ws auth failed by timeout: " + DEFAULT_WS_RPC_TIMEOUT_MS + "ms");
    _this.disconnectFromWs();
}, DEFAULT_WS_RPC_TIMEOUT_MS);
this.wsSetCallbackByCommandId(1, async, function (data) {
    clearTimeout(responseTimeout);
    if (!data.username ||
        !data.serverTime ||
        !data.userInfo) {
        return reject("auth failed: " + js(data));
    }
    data.userInfo = JSON.parse(data.userInfo);
    state.authData = data;
    as;
    AuthData;
    state.wsAuthed = true;
    state.wsLocalTimeMs = Date.now();
    state.wsServerTimeMs = state.authData.serverTime * 1000;
    reporter("auth complete: " + data.username);
    resolve();
    return true; // remove me
});
await;
this.wsSend(1, {
    aliSAFData: aliSAFData,
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
    changeServer: options.switchServer ? 1 : undefined
});
;
wsSetCallbackByCommandId(commandId, number, cb, GameBotWsCallback);
void {
    const: (_s = this, state = _s.state, _s),
    if: function () { } };
!state.wsCallbacksByCommandId[commandId];
{
    state.wsCallbacksByCommandId[commandId] = [];
}
state.wsCallbacksByCommandId[commandId].push(cb);
async;
onWsMessage(rawData, string);
Promise < void  > {
    const: (_t = this, config = _t.config, _t),
    if: function (config, game, printWsPackets) {
        console.log(colors_1["default"].gray('💎 in:'), colors_1["default"].gray(crop_1["default"](rawData, config.game.printWsPacketsMaxLength)));
    },
    const: packet, GameWsIncomingPacket:  = JSON.parse(rawData),
    try: {
        packet: (_u = JSON.parse(packet[WS_FIELD_INCOMING_DATA]), WS_FIELD_INCOMING_DATA = _u[0], _u)
    }, catch: {},
    await: this.applyCallbacksByCommandId(packet),
    await: this.applyCallbacksByIndex(packet)
};
async;
applyCallbacksByCommandId(packet, GameWsIncomingPacket);
Promise < void  > {
    const: (_v = this, state = _v.state, _v),
    const: commandId = packet[WS_FIELD_COMMAND_ID],
    const: cbs = state.wsCallbacksByCommandId[commandId],
    if: function () { } };
!cbs;
return;
var newCbs = [];
for (var i = 0; i < cbs.length; ++i) {
    var cb = cbs[i];
    var removeMe = await, cb = (packet[WS_FIELD_INCOMING_DATA]);
    if (!removeMe) {
        newCbs.push(cb);
    }
}
if (newCbs.length) {
    state.wsCallbacksByCommandId[commandId] = newCbs;
}
else {
    delete state.wsCallbacksByCommandId[commandId];
}
async;
applyCallbacksByIndex(packet, GameWsIncomingPacket);
Promise < void  > {
    const: (_w = this, state = _w.state, _w),
    const: packetIndex = packet[WS_FIELD_PACKET_INDEX],
    const: cb = state.wsCallbacksByPacketIndex[packetIndex],
    if: function () { } };
!cb;
return;
await;
cb(packet[WS_FIELD_INCOMING_DATA]);
// always remove
delete state.wsCallbacksByPacketIndex[packetIndex];
startWsPings();
void {
    const: (_x = this, state = _x.state, _x),
    state: .wsPingInterval &&
        clearInterval(state.wsPingInterval),
    state: .wsPingInterval = setInterval(async(), {
        if: function () { } }, !state.wsConnected), return: ,
    if: function (state, wsConnecting) { }, return: ,
    if: function () { } };
!state.wsAuthed;
return;
if (!state.ws)
    return;
// {"c":0,"o":"38","p":{}}
// {"c":0,"s":0,"d":"{\"t\":1602242818291}","o":"38"}
await;
this.wsRPC(0, {});
WS_PING_INTERVAL_MS;
;
async;
triggerWsConnectSemaphore();
Promise < void  > {
    const: cbs = this.state.wsConnectSemaphoreCallbacks,
    for: function (let, i) {
        if (let === void 0) { let = i = 0; }
        if (i === void 0) { i = ; }
    } }++;
i;
{
    await;
    cbs[i].call(this);
}
this.state.wsConnectSemaphoreCallbacks = [];
waitForOtherThreadToConnectToWs();
Promise < void  > {
    return: new Promise(function (resolve, reject) {
        var _a = _this, reporter = _a.reporter, state = _a.state;
        if (state.wsConnected)
            return;
        if (!state.wsConnecting)
            return;
        reporter("already connecting in other thread, waiting ...");
        state.wsConnectSemaphoreCallbacks.push(resolve);
    })
};
disconnectFromWs(options, GameBotWsConnectOptions = {});
void (_y = ["disconnected from ws", ""], _y.raw = ["disconnected from ws", ""], ({
    const: (_z = this, state = _z.state, reporter = _z.reporter, _z),
    if: function (state, ws) {
        state.ws.close();
    },
    options: .switchServer || delete state.clientVersion,
    options: .switchServer || delete state.session,
    options: .switchServer || delete state.serverInfo,
    delete: state.authData,
    state: .wsConnected = false,
    state: .wsConnecting = false,
    state: .wsAuthed = false,
    delete: state.ws,
    state: .wsPingInterval && clearInterval(state.wsPingInterval),
    state: .wsInactivityTimeout && clearTimeout(state.wsInactivityTimeout),
    delete: state.wsPingInterval,
    delete: state.wsInactivityTimeout,
    state: .wsNextPacketIndex = options.switchServer ? state.wsNextPacketIndex : 0,
    state: .wsCallbacksByCommandId = {},
    state: .wsCallbacksByPacketIndex = {},
    state: .wsConnectSemaphoreCallbacks = [],
    delete: state.wsLocalTimeMs,
    delete: state.wsServerTimeMs,
    reporter: function () { } })(_y, options.switchServer ? ' for reconnection' : ''));
;
async;
getCurrentServerTime();
Promise < number > {
    const: (_0 = this, state = _0.state, _0),
    await: this.connectToWs(),
    if: function () { } };
!state.wsLocalTimeMs || !state.wsServerTimeMs;
{
    throw Error('wsLocalTimeMs or wsServerTimeMs is missing');
}
var deltaMs = state.wsLocalTimeMs - state.wsServerTimeMs;
var localMs = Date.now();
var serverMs = localMs - deltaMs;
return Math.floor(serverMs / 1000);
getGpToken();
string;
{
    if (this.cookieJar) {
        var cookieKey = this.cookieJar.getCookieKey(this.config.game.gpTokenCookie.params.host, this.config.game.gpTokenCookie.name);
        var cookieValue = this.cookieJar.getCookieValueByKey(cookieKey);
        if (cookieValue) {
            return cookieValue;
        }
    }
    return this.options.gpToken;
}
async;
getCurrentServerId();
Promise < number > {
    const: (_1 = this, state = _1.state, _1),
    if: function () { } };
!state.serverInfo;
await;
this.getServerInfo();
if (!state.serverInfo)
    throw Error('no state.serverInfo');
return state.serverInfo.serverId;
async;
switchToServerId({
    targetServerId: targetServerId
}, {
    targetServerId: number
});
Promise < void  > {
    if: function () { } };
!targetServerId;
throw Error('no targetServerId');
var currentServerId = await;
this.getCurrentServerId();
if (currentServerId === targetServerId) {
    // already on target server
    return;
}
var serverInfo = this.state.serverInfo;
if (!serverInfo)
    throw Error('no serverInfo');
this.reporter("switching server: " + currentServerId + " -> " + targetServerId);
var allServers = await, getAllServers = (this);
if (!allServers)
    throw Error('no allServers');
var targetServer = allServers.showServerList.serverList.find(function (s) {
    return s.id === targetServerId &&
        s.url &&
        s.platforms.toLowerCase().includes('g123');
});
if (!targetServer) {
    throw Error("targetServerId=" + targetServerId + " is not available for switching");
}
var accountOnTargetServer = allServers.serverList.find(function (acc) {
    return acc.serverId === targetServerId;
});
var targetAccountId = accountOnTargetServer ? String(accountOnTargetServer.uid) : '';
await;
switchServerAccount_1["default"](this, {
    targetServerId: targetServerId,
    targetAccountId: targetAccountId
});
this.disconnectFromWs({
    switchServer: true
});
serverInfo.serverId = targetServer.id;
serverInfo.g123Url = targetServer.url;
serverInfo.region = "countrys: " + targetServer.countrys;
await;
this.connectToWs({
    switchServer: true
});
async;
deleteAllAccountsExceptCurrent();
Promise < void  > {
    const: currentServerId = await, this: .getCurrentServerId(),
    const: allServers = await, getAllServers: function () { }, this: ,
    if: function () { } };
!allServers;
throw Error('no allServers');
await;
asyncForeach_1["default"](allServers.serverList, async, function (acc) {
    if (acc.serverId === currentServerId)
        return;
    if (!acc.canDel)
        return;
    if (acc.level >= 60)
        return; // do not delete precious accounts!
    _this.reporter("deleting account: s" + acc.serverId + " lvl " + acc.level + " ...");
    await;
    deleteAccount_1["default"](_this, { accountId: String(acc.uid) });
});
async;
getAllUnits();
Promise < Unit[] > {
    await: this.connectToWs(),
    if: function () { } };
!this.state.authData;
throw Error('no authData');
return this.state.authData.armys;
async;
getAllBuildings();
Promise < Building[] > {
    await: this.connectToWs(),
    if: function () { } };
!this.state.authData;
throw Error('no authData');
return this.state.authData.buildings;
async;
getBuildingsByTypeId(buildingTypeId, number);
Promise < Building[] > {
    return: function (await) {
        if (await === void 0) { await = this.getAllBuildings(); }
    }, filter: function (b, b, buildingId) { }
};
async;
getMergeableUnits();
Promise < Unit[] > {
    return: function (await) {
        if (await === void 0) { await = this.getAllUnits(); }
    }, filter: function (u, 
        // not marching
        u, march) { }
};
async;
getFightableUnits();
Promise < Unit[] > {
    return: function (await) {
        if (await === void 0) { await = this.getAllUnits(); }
    }, filter: function (u, 
        // not marching
        u, march) { }
};
async;
getUnitsByTypeId(unitTypeId, number);
Promise < Unit[] > {
    return: function (await) {
        if (await === void 0) { await = this.getAllUnits(); }
    }, filter: function (u, u, armyId) { }
};
async;
getMergeableUnitsGroups();
Promise < (_2 = {}, _2[key] = string, _2.Unit = [], _2) > {
    const: groups };
{
    [key, string];
    Unit[];
}
{ }
;
var mergeableUnits = await;
this.getMergeableUnits();
mergeableUnits.forEach(function (u) {
    groups[u.armyId] = groups[u.armyId] || [];
    groups[u.armyId].push(u);
});
return groups;
async;
getStrongestUnitsForFight(perfectUnitsAmount, number = 1);
Promise < Unit[] > {
    if: function (perfectUnitsAmount) {
        if (perfectUnitsAmount === void 0) { perfectUnitsAmount = 1 || perfectUnitsAmount > 9; }
        throw Error("invalid perfectUnitsAmount: " + perfectUnitsAmount);
    },
    const: units = await, this: .getFightableUnits(),
    if: function (units, length) {
        if (length === void 0) { length = 1; }
        throw Error("not enough fightable units for fight. minimum: 1");
    },
    // @TODO army units are always weakest because 10001 is less than 20001
    units: .sort(function (u1, u2) { return u1.armyId > u2.armyId ? -1 : u1.armyId < u2.armyId ? 1 : 0; }),
    return: units.slice(0, perfectUnitsAmount)
};
updateUnitTypeId(unitId, string, unitTypeId, number);
void {
    this: .state.authData ? .armys.forEach(function (u) {
        if (u.id === unitId) {
            u.armyId = unitTypeId;
        }
    }) : 
};
updateUnit(unit, Unit);
void {
    let: updated = false,
    this: .state.authData ? .armys.forEach(function (u) {
        if (u.id === unit.id) {
            Object.assign(u, unit);
            updated = true;
        }
    }) : ,
    if: function () { } };
!updated;
{
    this.state.authData ? .armys.push(unit) : ;
}
updateBuilding(building, Building);
void {
    let: updated = false,
    this: .state.authData ? .buildings.forEach(function (b) {
        if (b.id === building.id) {
            Object.assign(b, building);
            updated = true;
        }
    }) : ,
    if: function () { } };
!updated;
{
    this.state.authData ? .buildings.push(building) : ;
}
warn(subject, string | number, text, string);
void {
    this: .reporter("----------\n WARNING: bad " + subject + ": " + text + "\n----------")
};
subscribeToAllNotifications();
void {
    const: (_3 = this, reporter = _3.reporter, warn = _3.warn, state = _3.state, _3),
    const: (authData = state.authData, state),
    if: function () { } };
!authData;
throw Error('no authData');
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":800.0}","o":null}
this.wsSetCallbackByCommandId(10001, async, function (data) {
    if (typeof data ? .voucher === undefined : )
        return warn(10001, js(data));
    var resources = data, as = Resources;
    authData.resource = resources;
    reporter('resources received');
});
// {"c":10201,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":99999,\"x\":24,\"y\":20,\"id\":\"1710339831034898436\",\"state\":0,\"march\":0}","o":null}
this.wsSetCallbackByCommandId(10201, async, function (data) {
    if (!data ? .id : )
        return warn(10201, js(data));
    var unit = data, as = Unit;
    await;
    _this.updateUnit(unit);
    reporter("unit added: " + unit.id);
});
// {"c":10202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":22,\"y\":26,\"id\":\"1710042903487277063\",\"state\":0,\"march\":0}","o":null}
this.wsSetCallbackByCommandId(10202, async, function (data) {
    if (!data ? .id : )
        return warn(10202, js(data));
    var unit = data, as = Unit;
    authData.armys = authData.armys.filter(function (u) { return u.id !== unit.id; });
    reporter("unit removed: " + unit.id);
});
// {"c":10012,"s":0,"d":"{\"power\":\"516.0\"}","o":null}
this.wsSetCallbackByCommandId(10012, async, function (data) {
    if (!data ? .power : )
        return warn(10012, js(data));
    authData.star = Number(data.power);
    reporter("power \u0394: " + authData.star);
});
// {"c":10124,"s":0,"d":"{\"treasureTasks\":[{\"num\":1.0,\"state\":1,\"taskId\":3}],\"isUpdate\":1}","o":null}
this.wsSetCallbackByCommandId(10124, async, function (data) {
    if (!data ? .treasureTasks : )
        return warn(10124, js(data));
    // state 0 - not finished
    // state 1 - can be claimed
    // state 2 - claimed
    await;
    asyncForeach_1["default"](data.treasureTasks, async, function (task) {
        if (task.state === 1) {
            await;
            claimTreasureTask_1["default"](_this, { taskId: task.taskId });
        }
    });
});
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
