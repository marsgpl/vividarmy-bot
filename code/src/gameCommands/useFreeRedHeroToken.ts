import { GameBot } from 'class/GameBot';

// {"c":862,"o":"186","p":{"extractId":2,"num":1,"useDiamond":false,"isFree":true,"useHaveNum":false}}

// {"c":862,"s":0,"d":"{\"rewards\":[{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":2400004,\"itemCount\":5}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}]}","o":"186"}

export default async function(game: GameBot): Promise<boolean> {
    const r = await game.wsRPC(862, {
        extractId: 2,
        num: 1,
        useDiamond: false,
        isFree: true,
        useHaveNum: false,
    });

    if (!r?.rewards) {
        game.reporter(`useFreeRedHeroToken failed: ${JSON.stringify(r)}`);
        return false;
    }

    // @TODO apply rewards

    game.reporter(`free red hero token claimed`);
    return true;
}
