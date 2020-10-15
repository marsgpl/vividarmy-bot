function (game, _a) {
    var accountId = _a.accountId;
    var r = await, game, wsRPC = (857, {
        targetUID: String(accountId)
    });
    if (r ? .targetUID != accountId : ) {
        throw Error("failed: " + JSON.stringify(r));
    }
    game.reporter("account id=" + accountId + " deleted");
}
