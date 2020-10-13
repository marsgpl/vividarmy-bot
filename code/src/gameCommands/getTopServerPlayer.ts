import { GameBot } from 'class/GameBot';
import { TopServerPlayer } from 'gameTypes/TopServerPlayer';

// {"c":1659,"o":"95","p":{"type":4,"serverId":602}}

// {"c":1659,"s":0,"d":"{\"list\":[{\"val\":3.4413970422800304E29,\"uid\":\"308038492762\",\"playerInfo\":\"{\\\"nationalflag\\\":233,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"hero_icon003_global\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":0,\\\"headimgurl_custom\\\":\\\"https://knight-cdn.akamaized.net/headimg/308038492762.jpg?v=1600999755521\\\",\\\"username\\\":\\\"OddLot\\\"}\",\"lv\":80,\"power\":3.4413970422800304E29,\"serverId\":602},.....],\"serverId\":602}","o":"95"}

export default async function(game: GameBot, options: {
    rank: number;
    serverId: number;
}): Promise<TopServerPlayer | null> {
    // game.reporter(`getTopServerPlayer: ${options.rank}, server ${options.serverId}`);

    const indexInResponse = options.rank - 1;

    const r = await game.wsRPC(1659, {
        type: 4,
        serverId: options.serverId,
    });

    const player = r?.list?.[indexInResponse];

    if (!player || !player.playerInfo) {
        game.reporter(`getTopLocalPlayer fail`);
        return null;
    }

    player.playerInfo = JSON.parse(player.playerInfo);

    return player as TopServerPlayer;
}
