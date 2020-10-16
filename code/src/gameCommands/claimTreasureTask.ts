import { GameBot } from 'class/GameBot';

// {"c":309,"o":"73","p":{"taskId":3}}

// {"c":309,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":2000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"addStage\":0}","o":"73"}

export default async function(game: GameBot, {
    taskId,
}: {
    taskId: number;
}): Promise<void> {
    const r = await game.wsRPC(309, {
        taskId: Number(taskId),
    });

    if (!r?.reward) {
        throw Error(`claimTreasureTask failed: ${JSON.stringify(r)}`);
    }

    game.reporter(`treasure task id=${taskId} claimed`);

    // @TODO apply reward
}
