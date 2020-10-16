import { GameBot } from 'class/GameBot';

// {"c":825,"o":"118","p":{}}

// {"c":825,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":800001,\"itemCount\":1}],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"timeReward\":{\"rewardTime\":1602803007,\"times\":1}}","o":"118"}

export default async function(game: GameBot): Promise<boolean> {
    const r = await game.wsRPC(825, {});

    if (!r?.reward) {
        game.reporter(`claimTimerTask failed: ${JSON.stringify(r)}`);
        return false;
    }

    // @TODO apply reward

    game.reporter(`timer task claimed`);
    return true;
}
