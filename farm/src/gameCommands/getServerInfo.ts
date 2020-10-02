import { DiscordBot } from 'DiscordBot';

// {"msg":"","pfuid":"GGPHTIAA","country":"","log":"sslChatToken:0|queryDeviceMapping:169|get new server info :169|","stop_reason":"","server_status":1,"appUrl":"wss://server-knight-s80.rivergame.net/s694","stop_end_time":0,"serverId":694,"url":"wss://knight-cn-tencent-520.rivergame.net/s694","ruUrl":"wss://knight-cn-tencent-520.rivergame.net/s694","badDev":"com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam","serverInfoToken":"Njk0LGcxMjMsR0dQSFRJQUEsd3NzOi8va25pZ2h0LWNuLXRlbmNlbnQtNTIwLnJpdmVyZ2FtZS5uZXQvczY5NCwxNjAwOTkwMDQ2ODU5LDk2MWZjMGMxZTBmOTIyYjU1M2M5Y2YyZGY2M2I3NDEwLCw=","globalUrl":"wss://knight-cn-tencent-520.rivergame.net/s694","t":169,"stop_start_time":0,"v":"1.0.42","now":1600990046,"showType":0,"g123Url":"wss://knight-cn-tencent-520.rivergame.net/s694","region":"cn-beijing","wssLines":"knight-cn-me.rivergame.net|wss://knight-cn-me.rivergame.net/s694,knight-cn.topwarapp.com|wss://knight-cn.topwarapp.com/s694,knight-cn-ru.rivergame.net|wss://knight-cn-ru.rivergame.net/s694,knight-cn-tencent-520.rivergame.net|wss://knight-cn-tencent-520.rivergame.net/s694,knight-cn-x.topwarapp.com|wss://knight-cn-x.topwarapp.com/s694","status":0,"wssLinesCN":"serverlist-knight.rivergame.net|wss://server-knight-s80.rivergame.net/s694,knight-cn-tencent.rivergame.net|wss://knight-cn-tencent-520.rivergame.net/s694"}

export default async function(bot: DiscordBot): Promise<void> {
    if (!bot.state) throw Error('no state');

    const { config, state } = bot;
    const { game } = state;

    const reporter = state.game.reporter;
    const browser = state.browser;

    if (!game.clientVersion) throw Error('no client version');
    if (!game.accountAuthCode) throw Error('no account code');

    const getServerInfoUrl = config.game.urls.getServerInfo
        .replace(':ts:', String(Date.now()))
        .replace(':token:', game.accountAuthCode)
        .replace(':appVersion:', game.clientVersion);

    const r = await browser.get(getServerInfoUrl, {}, {
        referer: config.game.urls.getServerInfo_referer,
        origin: config.game.urls.getServerInfo_origin,
    });

    const serverInfo = JSON.parse(r.body);

    const { serverId, serverInfoToken, g123Url, region } = serverInfo;

    if (!serverId || !serverInfoToken || !g123Url) {
        throw Error(`serverInfo is invalid: ${r.body}`);
    }

    const { server_status, stop_start_time, stop_end_time, msg, stop_reason } = serverInfo;

    if (server_status !== 1 || stop_start_time || stop_reason) {
        throw Error(`maintenance: ${stop_reason}; ${msg}; end time: ${stop_end_time}`);
    }

    bot.state.game.serverInfo = serverInfo;

    reporter(`server: ${serverId} ${region || 'no region'}`);
}
