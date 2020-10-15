import { GameBot } from 'class/GameBot';
import { TopLocalPlayer } from 'gameTypes/TopLocalPlayer';

// {"c":650,"o":"59","p":{"start":0,"end":29}}

// {"c":650,"s":0,"d":"{\"rank\":31651,\"list\":[{\"uid\":\"306931708505\",\"worldId\":8,\"showCareerId\":1205003,\"playerInfo\":\"{\\\"nationalflag\\\":233,\\\"gender\\\":0,\\\"avatarurl\\\":null,\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":1,\\\"headimgurl_custom\\\":\\\"https://knight-cdn.akamaized.net/headimg/306931708505.jpg?v=1600565988187\\\",\\\"username\\\":\\\"DoomStar\\\"}\",\"power\":\"1.0130461564961495E29\"},...}]}","o":"59"}

export default async function(game: GameBot, options: {
    offsetFrom: number;
    offsetTo: number;
}): Promise<TopLocalPlayer[] | null> {
    const r = await game.wsRPC(650, {
        start: Number(options.offsetFrom),
        end: Number(options.offsetTo),
    });

    const players = r?.list;

    if (!players) {
        game.reporter(`getTopLocalPlayers fail`);
        return null;
    }

    players.forEach((player: any) => {
        player.playerInfo = JSON.parse(player.playerInfo);
    });

    return players as TopLocalPlayer[];
}
