import { Farm } from 'class/Farm';

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

    // await puppet.mergeAllBuildings('gold -> 4');
    // await puppet.relocateInitialLvl4GoldMine();
    // await puppet.build3barracksLvl1();
    // await puppet.mergeAllBuildings('barracks -> 3');
    // await puppet.relocateInitialLvl3Barracks();
    // await puppet.order6unitsLvl3();
    // await puppet.mergeAllUnits('land -> 5');
    // await puppet.relocateLvl5Units();
}
