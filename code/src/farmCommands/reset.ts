import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    if (!puppet.can(`doAncientTank:2`)) {
        return this.log('already done');
    }

    await puppet.gameBot.switchToServerId({ targetServerId: 707 });
    await puppet.saveGpToken();
    await puppet.gameBot.deleteAllAccountsExceptCurrent();
}
