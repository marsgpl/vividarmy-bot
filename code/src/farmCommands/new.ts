import { Farm } from 'class/Farm';
import sleep from 'modules/sleep';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

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
    await puppet.repairInitialLvl1GoldMines();
    await puppet.moveTutorial(99);
    await puppet.relocateInitialLvl4Unit();
    await puppet.build3goldMinesLvl1();
    await puppet.doAncientTank(2);

    // await puppet.mergeAllBuildings('gold -> 4');
    // await puppet.relocateInitialLvl4GoldMine();
    // await puppet.build3barracksLvl1();
    // await puppet.mergeAllBuildings('barracks -> 3');
    // await puppet.relocateInitialLvl3Barracks();
    // await puppet.order6unitsLvl3();
    // await puppet.mergeAllUnits('land -> 5');
    // await puppet.relocateLvl5Units();
    // await puppet.buyBaseMapArea(705);
    // await puppet.fightBaseMapArea(705, 201, [
    //     ...getStrongestUnitsForFight(puppet.gameBot, 1),
    // ]);
    // await puppet.fightBaseMapArea(705, 202, [
    //     ...getStrongestUnitsForFight(puppet.gameBot, 2),
    // ]);
    // await puppet.fightBaseMapArea(705, 203, [
    //     ...getStrongestUnitsForFight(puppet.gameBot, 2),
    // ]);

    await sleep(3000);
}
