function (game, _a) {
    var targetServerId = _a.targetServerId, targetAccountId = _a.targetAccountId;
    var r = await, game, wsRPC = (848, {
        serverId: Number(targetServerId),
        uid: targetAccountId || "0",
        deviceType: 'wxMiniProgram'
    });
    if (r ? .uid != targetAccountId : ) {
        throw Error("switchServerAccount fail: " + JSON.stringify(r));
    }
    if (targetAccountId) {
        game.reporter("switched to account id=" + targetAccountId + " on server " + targetServerId);
    }
    else {
        game.reporter("created new account on server " + targetServerId);
    }
}
