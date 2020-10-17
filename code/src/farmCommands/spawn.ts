import { Farm } from 'class/Farm';
import claimDailyInviteBox from 'gameCommands/claimDailyInviteBox';
import claimTimerTask from 'gameCommands/claimTimerTask';
import reloadEventInfo from 'gameCommands/reloadEventInfo';
import useFreeRedHeroToken from 'gameCommands/useFreeRedHeroToken';
import useFreeSkillToken from 'gameCommands/useFreeSkillToken';
import sleep from 'modules/sleep';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    const allianceId = Number(process.argv[4]) || 0;

    if (allianceId < 100000000) {
        throw Error(`invalid allianceId: ${allianceId}`);
    }

    await puppet.gameBot.switchToServerId({ targetServerId: puppet.state.targetServerId });
    await puppet.saveGpToken();
    // await puppet.gameBot.deleteAllAccountsExceptCurrent();

    await puppet.doAncientTank(1);
    await puppet.moveTutorial(1);
    await puppet.moveTutorial(2);
    await puppet.mergeUnitsWhilePossible('initial:land4');
    await puppet.moveTutorial(3);
    await puppet.buyBaseMapArea(805);
    await puppet.fightBaseMapArea(805, 101, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(1)),
    ]);
    await puppet.moveTutorial(5);
    await puppet.moveTutorial(6);
    await puppet.repairBuildingsByTypeId(1701, 'Gold Mine lvl1');
    await puppet.moveTutorial(99);
    await puppet.relocateInitialLvl4Unit();
    await puppet.build5goldMinesLvl1();
    await puppet.doAncientTank(2);
    await puppet.doAncientTank(3);
    await puppet.buyBaseMapArea(705);
    await puppet.fightBaseMapArea(705, 201, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(1)),
    ]);
    await puppet.fightBaseMapArea(705, 202, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(705, 203, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.buyBaseMapArea(807);
    await puppet.fightBaseMapArea(807, 301, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(807, 302, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(807, 303, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.repairBuildingsByTypeId(1801, 'Gold Harvester');
    await puppet.repairBuildingsByTypeId(1901, 'Tech Center');
    await puppet.buyBaseMapArea(707);
    await puppet.fightBaseMapArea(707, 401, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(707, 402, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(2)),
    ]);
    await puppet.fightBaseMapArea(707, 403, [
        ...(await puppet.gameBot.getStrongestUnitsForFight(3)),
    ]);
    await puppet.repairBuildingsByTypeId(2001, 'Finance Center');
    await puppet.researchScienceById(320006, 'Tank 5->6');
    await puppet.researchScienceById(310006, 'Gold mine merge 5->6');

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
    await useFreeRedHeroToken(puppet.gameBot);
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

    await puppet.changeName(`UTH${puppetId}`);
    await puppet.changeFlag(233);
    await puppet.changeGender(1);

    await puppet.claimEventReward({ aid: 37, tid: 1139 });
    await puppet.claimEventReward({ aid: 37, tid: 1140 });
    await puppet.claimEventReward({ aid: 37, tid: 1141 });

    await puppet.joinAlliance(allianceId);
    await puppet.reinforceCapitalWithSingleUnit(99999);
}
