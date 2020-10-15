function (game, _a) {
    var taskId = _a.taskId;
    var r = await, game, wsRPC = (309, {
        taskId: Number(taskId)
    });
    if (!r ? .reward : ) {
        throw Error("failed: " + JSON.stringify(r));
    }
    game.reporter("treasure task id=" + taskId + " claimed");
    // @TODO apply reward
}
