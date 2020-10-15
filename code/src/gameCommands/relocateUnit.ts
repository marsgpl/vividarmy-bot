import { GameBot } from 'class/GameBot';
import { Unit } from 'gameTypes/Unit';
import { Pos } from 'localTypes/Pos';

// {"c":110,"o":"152","p":{"x":13,"y":23,"id":"1710042903487277067"}}

// {"c":110,"s":0,"d":"{\"army\":{\"warehouseId\":\"0\",\"armyId\":10004,\"x\":13,\"y\":23,\"id\":\"1710042903487277067\",\"state\":0,\"march\":0},\"x\":22,\"y\":28}","o":"152"}

export default async function(
    game: GameBot,
    unit: Unit,
    pos: Pos,
): Promise<boolean> {
    const r = await game.wsRPC(110, {
        x: Number(pos.x),
        y: Number(pos.y),
        id: String(unit.id),
    });

    if (!r?.army) {
        game.reporter(`relocate unit failed: ${JSON.stringify(r)}`);
        return false;
    }

    unit = r.army as Unit;

    game.updateUnit(unit);

    game.reporter(`unit moved: ${unit.id} -> ${JSON.stringify(pos)}`);
    return true;
}

// @TODO async
// {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":22,\"y\":28,\"li\":[]},{\"im\":true,\"x\":13,\"y\":23,\"li\":[{\"t\":2,\"i\":10004}]}]}","o":null}
