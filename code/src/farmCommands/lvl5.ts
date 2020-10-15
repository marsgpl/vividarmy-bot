import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    if (puppet.can(`doAncientTank:2`)) {
        throw Error('doAncientTank 2 not done');
    }

    if (!puppet.can(`researchScienceById:310006`)) {
        return this.log('already done');
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
}
