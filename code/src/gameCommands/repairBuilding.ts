import { GameBot } from 'class/GameBot';
import { Building } from 'gameTypes/Building';

// {"c":113,"o":"1030","p":{"id":"1710042903353059332"}}

// {"c":113,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":1602752099,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":16,\"y\":24,\"proCount\":0.0,\"state\":1,\"id\":\"1710042903353059332\",\"proTime\":1.602752109E9,\"proLastTime\":10.0}}","o":"1030"}

export default async function(game: GameBot, {
    buildingId,
}: {
    buildingId: string;
}): Promise<void> {
    const r = await game.wsRPC(113, {
        id: String(buildingId),
    });

    if (!r?.building || r?.building?.broken) {
        throw Error(`repairBuilding failed: ${JSON.stringify(r)}`);
    }

    const building = r.building as Building;

    game.updateBuilding(building);

    game.reporter(`building repaired: ${building.id}`);
}

// @TODO async
// {"c":10041,"s":0,"d":"{\"level\":1,\"exp\":10.0}","o":null}
// {"c":10101,"s":0,"d":"{\"broken\":0,\"proStartTime\":1602752099,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":16,\"y\":24,\"proCount\":0.0,\"state\":1,\"id\":\"1710042903353059332\",\"proTime\":1.602752109E9,\"proLastTime\":10.0}","o":null}
