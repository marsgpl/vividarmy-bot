function (game, _a) {
    var scienceId = _a.scienceId;
    var r = await, game, wsRPC = (816, {
        scienceId: Number(scienceId),
        gold: 0
    });
    if (r ? .science ? .scienceId !== scienceId :  : ) {
        game.reporter("researchScience failed: " + JSON.stringify(r));
        return false;
    }
    game.reporter("science researched: " + scienceId);
    return true;
}
// @TODO async
// {"c":816,"s":0,"d":"{\"science\":{\"scienceId\":320006,\"group\":320000}}","o":"123"}
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":0.0,\"paid_gold\":0.0,\"free_gold\":0.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":35100.0}","o":null}
// {"c":10021,"s":0,"d":"{\"syncTime\":1602768491,\"restorePoint\":1,\"reason\":\"upgrade_level\",\"buyTimes\":0,\"type\":1,\"pointMax\":50,\"point\":50,\"restoreSec\":360}","o":null}
// {"c":10041,"s":0,"d":"{\"level\":5,\"exp\":2880.0}","o":null}
// {"c":10401,"s":0,"d":"{\"itemId\":320001,\"amount\":2}","o":null}
