import { GameBot } from 'class/GameBot';

// {"c":203,"o":"114","p":{"delId":"1710042903487277063","targetId":"1710042903487277066"}}

// {"c":203,"s":0,"d":"{\"res\":\"suc\",\"targetId\":\"1710042903487277066\",\"armyId\":10002}","o":"114"}

export default async function(game: GameBot, {
    delId,
    targetId,
}: {
    delId: string;
    targetId: string;
}): Promise<boolean> {
    const r = await game.wsRPC(203, {
        delId: String(delId),
        targetId: String(targetId),
    });

    if (!r || r.res !== 'suc' || !r.targetId || !r.armyId) {
        game.reporter(`failed: ${JSON.stringify(r)}`);
        return false;
    }

    game.updateUnitTypeId(r.targetId, r.armyId);

    // @TODO preemptively remove delId building

    game.reporter(`units merged: ${delId} -> ${targetId}`);
    return true;
}

// @TODO async
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":800.0}","o":null}
// {"c":10202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10001,\"x\":22,\"y\":26,\"id\":\"1710042903487277063\",\"state\":0,\"march\":0}","o":null}
// {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":22,\"y\":26,\"li\":[]}]}","o":null}
