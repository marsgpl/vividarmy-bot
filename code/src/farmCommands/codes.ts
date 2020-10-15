import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    await puppet.usePromoCode('topwar888');
    await puppet.usePromoCode('TOPWAR-العربية');
    await puppet.usePromoCode('topwar621');
    await puppet.usePromoCode('G123_vividarmy');
}
