function (game, _a) {
    var buildingId = _a.buildingId;
    var r = await, game, wsRPC = (113, {
        id: String(buildingId)
    });
    if (!r ? .building || r ? .building ? .broken :  :  : ) {
        throw Error("failed: " + JSON.stringify(r));
    }
    var building = r.building, as = Building;
    game.updateBuilding(building);
    game.reporter("building repaired: " + building.id);
}
// @TODO async
// {"c":10041,"s":0,"d":"{\"level\":1,\"exp\":10.0}","o":null}
// {"c":10101,"s":0,"d":"{\"broken\":0,\"proStartTime\":1602752099,\"buildingId\":1701,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":16,\"y\":24,\"proCount\":0.0,\"state\":1,\"id\":\"1710042903353059332\",\"proTime\":1.602752109E9,\"proLastTime\":10.0}","o":null}
