import { GameBot } from 'class/GameBot';
import { AllServers } from 'gameTypes/AllServers';

// {"c":847,"o":"27","p":{"devPlatform":"g123","channel":"g123","lineAddress":""}}

// {"c":847,"s":0,"d":"{\"showServerList\":{\"badDev\":\"com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam\",\"serverList\":[{\"rate\":0,\"id\":73,\"url\":\"wss://knight-cn-tencent.rivergame.net/s73\",\"countrys\":\"jp\",\"wssLines\":\"knight-cn-tencent.rivergame.net|wss://knight-cn-tencent.rivergame.net/s73\",\"platforms\":\"googleplay|g123|appiosglobal\",\"wssLinesCN\":\"serverlist-knight.rivergame.net|wss://server-knight.rivergame.net/s73,knight-cn-tencent.rivergame.net|wss://knight-cn-tencent.rivergame.net/s73\"},]},\"serverList\":[{\"uid\":489051796176,\"canDel\":1,\"level\":1,\"playerInfo\":\"{\\\"nationalflag\\\":114,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"headIcon_1_1\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":0,\\\"username\\\":\\\"wy.489051796176\\\"}\",\"userName\":\"wy.489051796176\",\"serverId\":720}],\"playerInfo\":\"{\\\"nationalflag\\\":114,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"headIcon_1_1\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":0,\\\"username\\\":\\\"wy.489051796176\\\"}\",\"region\":\"cn-beijing\"}","o":"27"}

export default async function(game: GameBot): Promise<AllServers | null> {
    const r = await game.wsRPC(847, {
        devPlatform: 'g123',
        channel: 'g123',
        lineAddress: '',
    });

    const playerInfo = r?.playerInfo;

    if (!r?.serverList || !r?.showServerList?.serverList) {
        game.reporter(`getAllServers fail`);
        return null;
    }

    r.playerInfo = JSON.parse(playerInfo);

    r.serverList.map((server: any) => {
        server.playerInfo = JSON.parse(server.playerInfo);
    });

    return r as AllServers;
}
