function (game, unit, pos) {
    var r = await, game, wsRPC = (110, {
        x: Number(pos.x),
        y: Number(pos.y),
        id: String(unit.id)
    });
    if (!r ? .army : ) {
        game.reporter("relocate unit failed: " + JSON.stringify(r));
        return false;
    }
    unit = r.army;
    as;
    Unit;
    game.updateUnit(unit);
    game.reporter("unit moved: " + unit.id + " -> " + JSON.stringify(pos));
    return true;
}
// @TODO async
// {"c":10102,"s":0,"d":"{\"data\":[{\"im\":false,\"x\":22,\"y\":28,\"li\":[]},{\"im\":true,\"x\":13,\"y\":23,\"li\":[{\"t\":2,\"i\":10004}]}]}","o":null}
