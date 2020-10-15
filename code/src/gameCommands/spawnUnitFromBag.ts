import { GameBot } from 'class/GameBot';
import { Pos } from 'localTypes/Pos';

// {"c":202,"o":"123","p":{"armyId":10004,"x":24,"y":28}}

// {"c":202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10006,\"x\":31,\"y\":19,\"id\":\"1710802505078236166\",\"state\":0,\"march\":0}","o":"83"}

export default async function(game: GameBot, unitTypeId: number, pos: Pos): Promise<boolean> {
    const r = await game.wsRPC(202, {
        armyId: Number(unitTypeId),
        x: Number(pos.x),
        y: Number(pos.y),
    });

    if (r?.armyId !== unitTypeId) {
        game.reporter(`spawnUnitFromBag failed: ${JSON.stringify(r)}`);
        return false;
    }

    game.updateUnit(r);

    game.reporter(`unit spawned from bag: ${unitTypeId}`);
    return true;
}

// @TODO async
// {"c":10102,"s":0,"d":"{\"data\":[{\"im\":true,\"x\":23,\"y\":29,\"li\":[{\"t\":2,\"i\":10005}]}]}","o":null}
// {"c":10203,"s":0,"d":"{\"armyNum\":4,\"armyId\":10006,\"overdueTime\":0}","o":null}
// {"c":10201,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10006,\"x\":31,\"y\":19,\"id\":\"1710802505078236166\",\"state\":0,\"march\":0}","o":null}
