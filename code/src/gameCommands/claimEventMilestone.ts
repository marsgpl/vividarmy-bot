import { GameBot } from 'class/GameBot';

// {"c":1642,"o":"205","p":{"id":30000,"score":100,"adv":0}}

// {"c":1642,"s":0,"d":"{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":2300002,\"itemCount\":4},{\"itemId\":1000003,\"itemCount\":10}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}","o":"205"}

export default async function(game: GameBot, {
    id,
    score,
    adv,
}: {
    id: number;
    score: number;
    adv: number;
}): Promise<boolean> {
    const r = await game.wsRPC(842, {
        id: Number(id),
        score: Number(score),
        adv: Number(adv),
    });

    if (!r?.reward) {
        game.reporter(`claimEventMilestone failed: ${JSON.stringify(r)}`);
        return false;
    }

    // @TODO apply reward

    game.reporter(`event milestone claimed`);
    return true;
}

// @TODO async
// {"c":10901,"s":0,"d":"{\"num\":1.0,\"state\":2,\"aid\":194,\"tid\":6901,\"key\":\"atarget\",\"quality\":0}","o":null}
// {"c":10401,"s":0,"d":"{\"itemId\":200003,\"amount\":2}","o":null}
// {"c":10402,"s":0,"d":"{\"items\":[{\"itemId\":2300002,\"amount\":4},{\"itemId\":1000003,\"amount\":10}]}","o":null}
