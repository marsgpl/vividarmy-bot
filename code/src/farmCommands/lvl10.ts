import { Farm } from 'class/Farm';
import reloadEventInfo from 'gameCommands/reloadEventInfo';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    // @TODO check for already done

    if (puppet.can(`researchScienceById:310006`)) {
        throw Error('lvl5 not ready');
    }

    await puppet.relocateOldTankToLeft();
    await puppet.removeObstacle(1023, { x:20, y:20 }, 'Stone');
    await puppet.removeObstacle(1022, { x:20, y:16 }, 'Ad chest');
    await puppet.spawnLvl4TanksFromBag();
    await puppet.spawnLvl5TanksFromBag();
    await puppet.mergeUnitsWhilePossible('initial:land6');
    await puppet.buyBaseMapArea(606);
    await puppet.fightBaseMapArea(606, 501, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(606, 502, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(606, 503, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(3)),
    ]);
    await puppet.repairBuildingsByTypeId(2201, 'Tax Center');
    await puppet.relocateLvl6AndOldToTop();
    await puppet.spawnLvl6TanksFromBag();
    await puppet.researchScienceById(310007, 'gold mine merge 6->7');
    await puppet.buyBaseMapArea(605);
    await puppet.fightBaseMapArea(605, 601, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(605, 602, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(3)),
    ]);
    await puppet.fightBaseMapArea(605, 603, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(3)),
    ]);
    await puppet.spawnLvl7TanksFromBag();

    await reloadEventInfo(puppet.gameBot);

    await puppet.claimEventReward({ aid: 194, tid: 6901 });
    await puppet.claimEventReward({ aid: 194, tid: 6903 });
    await puppet.claimEventReward({ aid: 194, tid: 6915 });
    await puppet.claimEventReward({ aid: 30000, tid: 10065 });
    await puppet.claimEventReward({ aid: 30000, tid: 10066 });
    await puppet.claimTimerTask();
    await puppet.researchScienceById(320007, 'Army units 6->7');
    await puppet.researchScienceById(320008, 'Army units 7->8');
    await puppet.repairBuildingsByTypeId(2101, 'Repair Factory');
    await puppet.claimEventReward({ aid:37, tid: 1139 });

    // receive unit from npc
    // {"c":1152,"o":"140","p":{"multiple":0}}
    // {"c":1152,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[{\"itemId\":10008,\"itemCount\":1}],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"fakeAlReward\":1}","o":"140"}

    // use free red hero token
    // {"c":862,"o":"186","p":{"extractId":2,"num":1,"useDiamond":false,"isFree":true,"useHaveNum":false}}
    // {"c":862,"s":0,"d":"{\"rewards\":[{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":2400004,\"itemCount\":5}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}]}","o":"186"}

    // use free blue hero ticket 1/5
    // {"c":862,"o":"190","p":{"extractId":1,"num":1,"useDiamond":false,"isFree":true,"useHaveNum":false}}

    // use free skill ticket 1/5
    // {"c":862,"o":"193","p":{"extractId":4,"num":1,"useDiamond":false,"isFree":true,"useHaveNum":false}}

    // claim lvlup reward
    // {"c":842,"o":"200","p":{"aid":194,"tid":6909}}

    // claim battery path reward
    // {"c":842,"o":"203","p":{"aid":30000,"tid":10082}}

    // claim battery path milestone
    // {"c":1642,"o":"205","p":{"id":30000,"score":100,"adv":0}}
    // {"c":1642,"s":0,"d":"{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":2300002,\"itemCount\":4},{\"itemId\":1000003,\"itemCount\":10}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}","o":"205"}
    // {"c":10402,"s":0,"d":"{\"items\":[{\"itemId\":2300002,\"amount\":4},{\"itemId\":1000003,\"amount\":10}]}","o":null}

    // claim bird path reward
    // {"c":842,"o":"215","p":{"aid":500092,"tid":10220}}
    // {"c":842,"o":"216","p":{"aid":500092,"tid":10225}}
    // {"c":842,"o":"217","p":{"aid":500092,"tid":10242}}

    // claim bird path milestone
    // {"c":1642,"o":"218","p":{"id":500092,"score":20,"adv":0}}
    // {"c":1642,"o":"220","p":{"id":500092,"score":50,"adv":0}}

    // claim daily invite box
    // {"c":846,"o":"222","p":{"aid":10,"tid":541,"type":0}}
    // {"c":846,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":5.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"num\":0.0,\"state\":2,\"aid\":10,\"tid\":541,\"key\":\"atarget\"}","o":"222"}
    // {"c":10901,"s":0,"d":"{\"num\":0.0,\"state\":2,\"aid\":10,\"tid\":541,\"key\":\"atarget\",\"quality\":0}","o":null}

    // research tank 8-?9
    // {"c":816,"o":"231","p":{"scienceId":320009,"gold":0}}

    // claim lvlup task
    // {"c":842,"o":"239","p":{"aid":194,"tid":6904}}

    // research barracks build 1->2
    // {"c":816,"o":"242","p":{"scienceId":301002,"gold":0}}

    // barracks merge 5->6
    // {"c":816,"o":"244","p":{"scienceId":311006,"gold":0}}

    // tank lvl 9->10
    // {"c":816,"o":"246","p":{"scienceId":320010,"gold":0}}

    // read all emails
    // {"c":936,"o":"264","p":{"group":-1}}
    // {"c":936,"s":0,"d":"{\"rewardResult\":{\"resource\":{\"gold\":50.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"mailIds\":\"[1710380321184365576,1710380321268251657,1710380321335360518,1710380321368914950,1710380321402469385,1710380321436023814,1710624712356477961]\"}","o":"264"}
    // {"c":934,"o":"265","p":{}}
    // {"c":934,"s":0,"d":"{\"all\":11,\"all_unread\":0,\"5_unread\":0,\"6_unread\":0,\"7_unreward\":0,\"4_unreward\":0,\"1_unread\":0,\"2_unread\":0,\"1_unreward\":0,\"7_unread\":0,\"3_unread\":0,\"4_unread\":0,\"5_unreward\":0,\"1\":3,\"2\":0,\"3\":8,\"4\":0,\"5\":0,\"2_unreward\":0,\"6\":0,\"7\":0,\"6_unreward\":0,\"3_unreward\":0}","o":"265"}

    // research unit repair speed 0->1
    // {"c":816,"o":"274","p":{"scienceId":329001,"gold":0}}

    // build book center
    // {"c":100,"o":"282","p":{"x":20,"y":20,"buildingId":2401}}
        // {"c":100,"s":0,"d":"{\"building\":{\"broken\":0,\"proStartTime\":0,\"buildingId\":2401,\"confirm\":0,\"helpAmount\":0,\"curProductNum\":0,\"productIds\":[],\"proId\":0,\"x\":20,\"y\":20,\"proCount\":0.0,\"state\":1,\"id\":\"1710914467376227330\",\"proTime\":0.0,\"proLastTime\":0.0}}","o":"282"}
        // {"c":10902,"s":0,"d":"{\"time\":1602811249}","o":null}

    // build barracks lvl2
    // {"c":100,"o":"288","p":{"x":22,"y":22,"buildingId":1042}}
    // {"c":100,"o":"290","p":{"x":24,"y":20,"buildingId":1042}}
    // {"c":100,"o":"291","p":{"x":22,"y":18,"buildingId":1042}}

    // await puppet.mergeAllBuildings('gold -> 4');
    // await puppet.relocateInitialLvl4GoldMine();
    // await puppet.build3barracksLvl1();
    // await puppet.mergeAllBuildings('barracks -> 3');
    // await puppet.relocateInitialLvl3Barracks();
    // await puppet.order6unitsLvl3();
    // await puppet.mergeAllUnits('land -> 5');
    // await puppet.relocateLvl5Units();
}
