import { GameBot } from 'class/GameBot';
import { PlayerPointInfo } from 'gameTypes/PlayerPointInfo';

// {"c":909,"o":"68","p":{"targetId":"317451149913"}}

// {"c":909,"s":0,"d":"{\"point\":{\"p\":{\"plateId\":0,\"sBNum\":0,\"level\":7,\"shieldTime\":1602322573,\"fireTime\":0,\"playerInfo\":\"{\\\"nationalflag\\\":114,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"headIcon_2_1\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":1,\\\"username\\\":\\\"GG123\\\"}\",\"castleEffectId\":0,\"pid\":317451149913,\"skinId\":0,\"language\":\"ja\",\"sml\":0,\"province\":56,\"w\":601,\"sskin\":0,\"power\":2354.0,\"fireState\":0,\"aid\":100100977,\"countryRank\":0,\"sBId\":0,\"a_tag\":\"l337\"},\"x\":21,\"y\":573,\"k\":601,\"id\":146699,\"pointType\":1}}","o":"68"}

export default async function(game: GameBot, options: {
    playerId: string;
}): Promise<PlayerPointInfo | null> {
    // game.reporter(`getPlayerPointInfo: ${options.playerId}`);

    const r = await game.wsRPC(909, {
        targetId: String(options.playerId),
    });

    const playerInfo = r?.point?.p?.playerInfo;

    if (!r?.point || !playerInfo) {
        game.reporter(`getPlayerPointInfo fail`);
        return null;
    }

    r.point.p.playerInfo = JSON.parse(playerInfo);

    return r.point as PlayerPointInfo;
}
