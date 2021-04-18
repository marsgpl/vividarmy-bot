const log = require('modules/log').setName('switchServer');
const connectToGameWs = require('commands/connectToGameWs');
const cws = require('constants/ws-game');

module.exports = (ctx, { account, newServerId }) => new Promise((resolve, reject) => {
    log('start');

    connectToGameWs(ctx, { account }).then(ws => {
        const packet = {
            [cws.WS_GAME_OUT_COMMAND]: cws.WS_GAME_COMMAND_GET_SERVER_LIST,
            [cws.WS_GAME_OUT_PACKET_INDEX]: String(ctx.gameWsNextPacketIndex++),
            [cws.WS_GAME_OUT_PAYLOAD]: {
                devPlatform: 'g123',
                channel: 'g123',
                lineAddress: '',
            },
        };

        ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_SERVER_LIST] = ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_SERVER_LIST] || [];
        ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_GET_SERVER_LIST].push((ctx, data, payload) => {
            /*
                [
                    {
                        uid: 477602136637,
                        canDel: 1,
                        level: 1,
                        playerInfo: '{"nationalflag":114,"gender":0,"avatarurl":"headIcon_1_1","nickname":null,"headimgurl":null,"usergender":0,"username":"wy.477602136637"}',
                        userName: 'wy.477602136637',
                        serverId: 573
                    },
                    ...
                ]
            */
            // const myServers = payload.serverList;

            /*
                [
                    {
                        rate: 0,
                        id: 368,
                        url: 'wss://knight-us.topwargame.com/s368',
                        countrys: '',
                        wssLines: 'knight-us.topwargame.com|wss://knight-us.topwargame.com/s368,knight-us-gcp-576.topwargame.com|wss://knight-us-gcp.topwargame.com/s368,knight-us-sh-axesdn-576.rivergame.net|wss://knight-us-sh-axesdn.rivergame.net/s368,knight-us-sh-tencent.rivergame.net|wss://knight-us-sh-tencent.rivergame.net/s368,knight-us-br.topwarapp.com|wss://knight-us-br.topwarapp.com/s368,knight-us-br-576.topwarapp.com|wss://knight-us-br.topwarapp.com/s368,knight-us-sh-tencent-576.rivergame.net|wss://knight-us-sh-tencent.rivergame.net/s368,knight-us-gcp.topwargame.com|wss://knight-us-gcp.topwargame.com/s368,knight-us-576.topwargame.com|wss://knight-us.topwargame.com/s368,knight-us-cloudflare-576.topwarapp.com|wss://knight-us-cloudflare.topwarapp.com/s368,knight-us-sh.rivergame.net|wss://knight-us-sh.rivergame.net/s368,knight-us-sh-576.rivergame.net|wss://knight-us-sh.rivergame.net/s368,knight-us-sh-axesdn.rivergame.net|wss://knight-us-sh-axesdn.rivergame.net/s368,knight-us-cloudflare.topwarapp.com|wss://knight-us-cloudflare.topwarapp.com/s368',
                        platforms: 'googleplay|g123|appiosglobal',
                        wssLinesCN: 'knight-us-sh-tencent.rivergame.net|wss://knight-us-sh-tencent.rivergame.net/s368,knight-us-sh.rivergame.net|wss://knight-us-sh.rivergame.net/s368,knight-us-sh-axesdn.rivergame.net|wss://knight-us-sh-axesdn.rivergame.net/s368'
                    }
                ]
            */
            const availServers = payload.showServerList.serverList;

            const newServer = availServers.find(server => server.id == newServerId);

            if (!newServer) {
                throw Error(`get server list failed: ${JSON.stringify(data)}`);
            }

            const isG123Supported = newServer.platforms.includes('g123');

            if (!isG123Supported) {
                throw Error(`new server does not support g123: ${JSON.stringify(newServer)}`);
            }

            log('switching to', newServer.id);

            const packet = {
                [cws.WS_GAME_OUT_COMMAND]: cws.WS_GAME_COMMAND_CHANGE_SERVER,
                [cws.WS_GAME_OUT_PACKET_INDEX]: String(ctx.gameWsNextPacketIndex++),
                [cws.WS_GAME_OUT_PAYLOAD]: {
                    serverId: Number(newServerId),
                    uid: '0',
                    deviceType: 'wxMiniProgram',
                },
            };

            ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_CHANGE_SERVER] = ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_CHANGE_SERVER] || [];
            ctx.gameWsCallbacksByCommand[cws.WS_GAME_COMMAND_CHANGE_SERVER].push((ctx, data, payload) => {
                ws.close();

                account.data.serverInfo.g123Url = newServer.url;
                account.data.serverInfo.serverId = newServer.id;

                connectToGameWs(ctx, { account, switchServer: true }).then(ws => {
                    resolve(ws);
                });
            });

            ws.send(JSON.stringify(packet));
        });

        ws.send(JSON.stringify(packet));
    }).catch(reject);
});
