import { Farm } from 'class/Farm';
import claimDailyInviteBox from 'gameCommands/claimDailyInviteBox';
import claimTimerTask from 'gameCommands/claimTimerTask';
import reloadEventInfo from 'gameCommands/reloadEventInfo';
import useFreeBlueHeroToken from 'gameCommands/useFreeBlueHeroToken';
import useFreeRedHeroToken from 'gameCommands/useFreeRedHeroToken';
import useFreeSkillToken from 'gameCommands/useFreeSkillToken';

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
    await puppet.researchScienceById(310007, 'Gold mine merge 6->7');
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

    await claimTimerTask(puppet.gameBot);

    await puppet.researchScienceById(320007, 'Tank 6->7');
    await puppet.researchScienceById(320008, 'Tank 7->8');
    await puppet.repairBuildingsByTypeId(2101, 'Repair Factory');
    await puppet.claimEventReward({ aid:37, tid: 1139 });
    // await puppet.receiveUnitFromNpc('initial');

    await useFreeRedHeroToken(puppet.gameBot);
    await useFreeBlueHeroToken(puppet.gameBot);
    await useFreeSkillToken(puppet.gameBot);

    await puppet.claimEventReward({ aid: 194, tid: 6909 });
    await puppet.claimEventReward({ aid: 30000, tid: 10082 });
    await puppet.claimEventMilestone({ id: 30000, score: 100, adv: 0 });
    await puppet.claimEventReward({ aid: 500092, tid: 10220 });
    await puppet.claimEventReward({ aid: 500092, tid: 10220 });
    await puppet.claimEventReward({ aid: 500092, tid: 10220 });
    await puppet.claimEventMilestone({ id: 500092, score: 20, adv: 0 });
    await puppet.claimEventMilestone({ id: 500092, score: 50, adv: 0 });

    await claimDailyInviteBox(puppet.gameBot);

    await puppet.researchScienceById(320009, 'Tank 8->9');
    await puppet.claimEventReward({ aid: 194, tid: 6904 });
    await puppet.researchScienceById(301002, 'Barracks build 1->2');
    await puppet.researchScienceById(311006, 'Barracks merge 5->6');
    await puppet.researchScienceById(320010, 'Tank 9->10');
    await puppet.researchScienceById(329001, 'Repair speed 0->1');
    await puppet.buildBookCenter();
    await puppet.build3barracksLvl2();

    // read all emails
    // {"c":936,"o":"264","p":{"group":-1}}
    // {"c":936,"s":0,"d":"{\"rewardResult\":{\"resource\":{\"gold\":50.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"mailIds\":\"[1710380321184365576,1710380321268251657,1710380321335360518,1710380321368914950,1710380321402469385,1710380321436023814,1710624712356477961]\"}","o":"264"}
    // {"c":934,"o":"265","p":{}}
    // {"c":934,"s":0,"d":"{\"all\":11,\"all_unread\":0,\"5_unread\":0,\"6_unread\":0,\"7_unreward\":0,\"4_unreward\":0,\"1_unread\":0,\"2_unread\":0,\"1_unreward\":0,\"7_unread\":0,\"3_unread\":0,\"4_unread\":0,\"5_unreward\":0,\"1\":3,\"2\":0,\"3\":8,\"4\":0,\"5\":0,\"2_unreward\":0,\"6\":0,\"7\":0,\"6_unreward\":0,\"3_unreward\":0}","o":"265"}

    // await puppet.mergeAllBuildings('gold -> 4');
    // await puppet.relocateInitialLvl4GoldMine();
    // await puppet.build3barracksLvl1();
    // await puppet.mergeAllBuildings('barracks -> 3');
    // await puppet.relocateInitialLvl3Barracks();
    // await puppet.order6unitsLvl3();
    // await puppet.mergeAllUnits('land -> 5');
    // await puppet.relocateLvl5Units();
}
