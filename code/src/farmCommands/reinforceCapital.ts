import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    await puppet.reinforceCapitalWithSingleUnit(99999);
}
