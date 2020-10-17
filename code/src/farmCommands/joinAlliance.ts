import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    const allianceId = Number(process.argv[4]) || 0;

    if (!allianceId) {
        throw Error(`allianceId not specified (arg[4])`);
    }

    await puppet.joinAlliance(allianceId);
}
