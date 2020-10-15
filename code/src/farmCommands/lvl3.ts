import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    if (!puppet.can(`doAncientTank:2`)) {
        return this.log('already done');
    }

    await puppet.gameBot.switchToServerId({ targetServerId: puppet.state.targetServerId });
    await puppet.saveGpToken();
    await puppet.gameBot.deleteAllAccountsExceptCurrent();

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
    await puppet.repairBuildingsByTypeId(1701, 'Gold Mine lvl 1');
    await puppet.moveTutorial(99);
    await puppet.relocateInitialLvl4Unit();
    await puppet.build5goldMinesLvl1();
    await puppet.doAncientTank(2);
}
