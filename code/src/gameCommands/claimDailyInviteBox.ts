import { GameBot } from 'class/GameBot';

// {"c":846,"o":"222","p":{"aid":10,"tid":541,"type":0}}

// {"c":846,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":5.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"num\":0.0,\"state\":2,\"aid\":10,\"tid\":541,\"key\":\"atarget\"}","o":"222"}

export default async function(game: GameBot): Promise<boolean> {
    const r = await game.wsRPC(846, {
        aid: 10,
        tid: 541,
        type: 0,
    });

    if (!r?.reward) {
        game.reporter(`claimDailyInviteBox failed: ${JSON.stringify(r)}`);
        return false;
    }

    // @TODO apply reward

    game.reporter(`invite box claimed`);
    return true;
}
