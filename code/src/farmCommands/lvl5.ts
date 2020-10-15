import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    if (puppet.can(`doAncientTank:2`)) {
        throw Error('doAncientTank 2 not done');
    }

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
    await puppet.researchScienceById(320006, 'army units 5->6');
    await puppet.researchScienceById(310006, 'gold mine merge 5->6');

    // {"c":202,"o":"99","p":{"armyId":10005,"x":28,"y":30}}
    // {"c":202,"o":"100","p":{"armyId":10005,"x":30,"y":26}}
    // {"c":202,"o":"101","p":{"armyId":10005,"x":27,"y":29}}
    // {"c":202,"o":"102","p":{"armyId":10005,"x":29,"y":25}}
    // {"c":202,"o":"103","p":{"armyId":10005,"x":26,"y":28}}
        // {"c":10102,"s":0,"d":"{\"data\":[{\"im\":true,\"x\":28,\"y\":30,\"li\":[{\"t\":2,\"i\":10005}]}]}","o":null}
        // {"c":10201,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10005,\"x\":28,\"y\":30,\"id\":\"1710317298059405316\",\"state\":0,\"march\":0}","o":null}
        // {"c":10012,"s":0,"d":"{\"power\":\"1818.0\"}","o":null}
        // {"c":10203,"s":0,"d":"{\"armyNum\":4,\"armyId\":10005,\"overdueTime\":0}","o":null}
        // {"c":202,"s":0,"d":"{\"warehouseId\":\"0\",\"armyId\":10005,\"x\":28,\"y\":30,\"id\":\"1710317298059405316\",\"state\":0,\"march\":0}","o":"99"}

    // await puppet.mergeAllBuildings('gold -> 4');
    // await puppet.relocateInitialLvl4GoldMine();
    // await puppet.build3barracksLvl1();
    // await puppet.mergeAllBuildings('barracks -> 3');
    // await puppet.relocateInitialLvl3Barracks();
    // await puppet.order6unitsLvl3();
    // await puppet.mergeAllUnits('land -> 5');
    // await puppet.relocateLvl5Units();
}
