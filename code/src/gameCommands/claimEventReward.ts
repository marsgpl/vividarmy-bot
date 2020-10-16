import { GameBot } from 'class/GameBot';

// {"c":842,"o":"101","p":{"aid":194,"tid":6903}}

// {"c":842,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":300000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":311001,\"itemCount\":10}],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"num\":5.0,\"state\":2,\"aid\":194,\"tid\":6903,\"key\":\"atarget\"}","o":"101"}
// {"c":842,"s":0,"d":"{\"tab\":2,\"num\":1.0,\"tableInfoType\":1,\"targetType\":7,\"id\":10065,\"state\":2,\"point\":10,\"key\":\"task\",\"target\":1,\"order\":6,\"desc\":\"BP_quest_des_006\",\"quality\":0}","o":"24"}

export default async function(game: GameBot, {
    aid,
    tid,
}: {
    aid: number;
    tid: number;
}): Promise<boolean> {
    const r = await game.wsRPC(842, {
        aid: Number(aid),
        tid: Number(tid),
    });

    if (typeof r === 'string') {
        game.reporter(`event reward aid=${aid} tid=${tid} failed: ${JSON.stringify(r)}`);
        return false;
    }

    // @TODO apply reward

    game.reporter(`event reward aid=${aid} tid=${tid} claimed`);
    return true;
}

// @TODO async
// {"c":10901,"s":0,"d":"{\"num\":1.0,\"state\":2,\"aid\":194,\"tid\":6901,\"key\":\"atarget\",\"quality\":0}","o":null}
// {"c":10401,"s":0,"d":"{\"itemId\":200003,\"amount\":2}","o":null}
