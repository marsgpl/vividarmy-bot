import { GameBot } from 'class/GameBot';
import { Building } from 'gameTypes/Building';
import { Pos } from 'localTypes/Pos';

// {"c":100,"o":"306","p":{"x":22,"y":26,"buildingId":1701}}

// {"c":100,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":1602765478,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":22,\"y\":26,\"proCount\":0.0,\"state\":1,\"id\":\"1710267366027913219\",\"proTime\":1.602765488E9,\"proLastTime\":0.0}}","o":"306"}

export default async function(
    game: GameBot,
    buildingTypeId: number,
    pos: Pos,
): Promise<boolean> {
    if (await game.isBuildingAlreadyBuilt(buildingTypeId, pos)) {
        game.reporter(`building already built: ${buildingTypeId} at ${JSON.stringify(pos)}`);
        return true;
    }

    const r = await game.wsRPC(100, {
        x: Number(pos.x),
        y: Number(pos.y),
        buildingId: Number(buildingTypeId),
    });

    if (!r?.building || r?.building?.broken) {
        game.reporter(`build failed: ${JSON.stringify(r)}`);
        return false;
    }

    const building = r.building as Building;

    game.updateBuilding(building);

    game.reporter(`built: ${building.id} -> ${JSON.stringify(pos)}`);
    return true;
}

// @TODO async
// {"c":10041,"s":0,"d":"{\"level\":2,\"exp\":110.0}","o":null}
// {"c":10102,"s":0,"d":"{\"data\":[{\"im\":true,\"x\":22,\"y\":26,\"li\":[{\"t\":1,\"i\":1701}]},{\"im\":false,\"x\":23,\"y\":27,\"li\":[{\"t\":1,\"i\":1701}]},{\"im\":false,\"x\":21,\"y\":27,\"li\":[{\"t\":1,\"i\":1701}]},{\"im\":false,\"x\":22,\"y\":28,\"li\":[{\"t\":1,\"i\":1701}]}]}","o":null}
// {"c":10101,"s":0,"d":"{\"broken\":0,\"proStartTime\":1602765478,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":22,\"y\":26,\"proCount\":0.0,\"state\":1,\"id\":\"1710267366027913219\",\"proTime\":1.602765488E9,\"proLastTime\":0.0}","o":null}
// {"c":10902,"s":0,"d":"{\"time\":0}","o":null}
// {"c":10448,"s":0,"d":"{\"orderList\":[912201,912501,912601,912701]}","o":null}
