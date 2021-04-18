const log = require('modules/log').setName('getServerInfo');

// {"msg":"","pfuid":"GGPHTIAA","country":"","log":"sslChatToken:0|queryDeviceMapping:169|get new server info :169|","stop_reason":"","server_status":1,"appUrl":"wss://server-knight-s80.rivergame.net/s694","stop_end_time":0,"serverId":694,"url":"wss://knight-cn-tencent-520.rivergame.net/s694","ruUrl":"wss://knight-cn-tencent-520.rivergame.net/s694","badDev":"com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam","serverInfoToken":"Njk0LGcxMjMsR0dQSFRJQUEsd3NzOi8va25pZ2h0LWNuLXRlbmNlbnQtNTIwLnJpdmVyZ2FtZS5uZXQvczY5NCwxNjAwOTkwMDQ2ODU5LDk2MWZjMGMxZTBmOTIyYjU1M2M5Y2YyZGY2M2I3NDEwLCw=","globalUrl":"wss://knight-cn-tencent-520.rivergame.net/s694","t":169,"stop_start_time":0,"v":"1.0.42","now":1600990046,"showType":0,"g123Url":"wss://knight-cn-tencent-520.rivergame.net/s694","region":"cn-beijing","wssLines":"knight-cn-me.rivergame.net|wss://knight-cn-me.rivergame.net/s694,knight-cn.topwarapp.com|wss://knight-cn.topwarapp.com/s694,knight-cn-ru.rivergame.net|wss://knight-cn-ru.rivergame.net/s694,knight-cn-tencent-520.rivergame.net|wss://knight-cn-tencent-520.rivergame.net/s694,knight-cn-x.topwarapp.com|wss://knight-cn-x.topwarapp.com/s694","status":0,"wssLinesCN":"serverlist-knight.rivergame.net|wss://server-knight-s80.rivergame.net/s694,knight-cn-tencent.rivergame.net|wss://knight-cn-tencent-520.rivergame.net/s694"}

module.exports = async function(ctx, { token, appVersion }) {
    log('start');

    const { conf, browser } = ctx;

    const serverInfoUrl = conf.vividarmy.serverInfoUrl
        .replace(':ts:', Date.now())
        .replace(':token:', token)
        .replace(':appVersion:', appVersion);

    const r = await browser.get(serverInfoUrl, {
        referer: conf.vividarmy.serversListUrl_referer,
        origin: conf.vividarmy.serversListUrl_origin,
    });

    const serverInfo = JSON.parse(r.body);

    if (!serverInfo.serverId ||
        !serverInfo.g123Url ||
        !serverInfo.serverInfoToken
    ) {
        throw Error(`serverInfo is invalid: ${r.body}`);
    }

    log(serverInfo.serverId);
    log(serverInfo.g123Url);

    return serverInfo;
};
