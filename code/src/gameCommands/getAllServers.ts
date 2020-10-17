import { GameBot } from 'class/GameBot';
import { AllServers } from 'gameTypes/AllServers';
import unique from 'modules/unique';

// {"c":847,"o":"27","p":{"devPlatform":"g123","channel":"g123","lineAddress":""}}

// {"c":847,"s":0,"d":"{\"showServerList\":{\"badDev\":\"com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam\",\"serverList\":[{\"rate\":0,\"id\":73,\"url\":\"wss://knight-cn-tencent.rivergame.net/s73\",\"countrys\":\"jp\",\"wssLines\":\"knight-cn-tencent.rivergame.net|wss://knight-cn-tencent.rivergame.net/s73\",\"platforms\":\"googleplay|g123|appiosglobal\",\"wssLinesCN\":\"serverlist-knight.rivergame.net|wss://server-knight.rivergame.net/s73,knight-cn-tencent.rivergame.net|wss://knight-cn-tencent.rivergame.net/s73\"},]},\"serverList\":[{\"uid\":489051796176,\"canDel\":1,\"level\":1,\"playerInfo\":\"{\\\"nationalflag\\\":114,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"headIcon_1_1\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":0,\\\"username\\\":\\\"wy.489051796176\\\"}\",\"userName\":\"wy.489051796176\",\"serverId\":720}],\"playerInfo\":\"{\\\"nationalflag\\\":114,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"headIcon_1_1\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":0,\\\"username\\\":\\\"wy.489051796176\\\"}\",\"region\":\"cn-beijing\"}","o":"27"}

const COMMAND_ID = unique(847);

export default async function(game: GameBot): Promise<AllServers> {
    const r = await game.wsRPC(COMMAND_ID, {
        devPlatform: 'g123',
        channel: 'g123',
        lineAddress: '',
    });

    const playerInfo = r?.playerInfo;

    if (!r?.serverList || !r?.showServerList?.serverList || !playerInfo) {
        throw Error(`getAllServers failed: ${JSON.stringify(r)}`);
    }

    r.playerInfo = JSON.parse(playerInfo);

    r.serverList.map((server: any) => {
        server.playerInfo = JSON.parse(server.playerInfo);
    });

    return r as AllServers;
}
