import { GameBot } from 'class/GameBot';
import { PlayerLocalInfo } from 'gameTypes/PlayerLocalInfo';

// {"c":630,"o":"75","p":{"uid":"307176813145"}}

// {"c":630,"s":0,"d":"{\"allianceId\":100067575,\"uid\":\"307176813145\",\"banEndTime\":0,\"allianceTag\":\"C0Ka\",\"level\":75,\"worldId\":27,\"showCareerId\":1002702,\"playerInfo\":\"{\\\"nationalflag\\\":167,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":1,\\\"headimgurl_custom\\\":\\\"https://knight-cdn.akamaized.net/headimg/307176813145.jpg?v=1599590746605\\\",\\\"username\\\":\\\"Swenor\\\"}\",\"allianceName\":\"C0braKai\",\"power\":3.7965801613583106E27}","o":"75"}

export default async function(game: GameBot, options: {
    playerId: string;
}): Promise<PlayerLocalInfo | null> {
    // game.reporter(`getPlayerLocalInfo: ${options.playerId}`);

    const r = await game.wsRPC(630, {
        uid: String(options.playerId),
    });

    const playerInfo = r?.playerInfo;

    if (!r?.uid || !playerInfo) {
        game.reporter(`getPlayerLocalInfo fail`);
        return null;
    }

    r.playerInfo = JSON.parse(playerInfo);

    return r as PlayerLocalInfo;
}
