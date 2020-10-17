import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    const tag = process.argv[4];

    if (!tag) {
        throw Error(`tag not specified (arg[4])`);
    }

    if (tag.length != 4) {
        throw Error(`tag length must be 4 symbols`);
    }

    await puppet.createAlliance({
        name: `UTH${puppetId}`,
        tag,
    });
}
