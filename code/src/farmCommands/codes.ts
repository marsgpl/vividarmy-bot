import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    await puppet.usePromoCode('topwar888');
    await puppet.usePromoCode('TOPWAR-العربية');
    await puppet.usePromoCode('topwar621');
    await puppet.usePromoCode('G123_vividarmy');
}

// -> {"c":695,"o":"107","p":{"code":"topwar888"}} // 200 diamonds
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":200.0,\"paid_gold\":0.0,\"free_gold\":200.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":3790.0}","o":null}
// {"c":695,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":200.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0}}","o":"107"}

// -> {"c":695,"o":"111","p":{"code":"TOPWAR-العربية"}} // 150 diamonds, 100 blue boxes
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":350.0,\"paid_gold\":0.0,\"free_gold\":350.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":3790.0}","o":null}
// {"c":10402,"s":0,"d":"{\"items\":[{\"itemId\":1800001,\"amount\":115}]}","o":null}
// {"c":695,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":150.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":1800001,\"itemCount\":100}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}}","o":"111"}

// -> {"c":695,"o":"115","p":{"code":"topwar621"}} // 100 diamonds, 10 red boxes, 2 VITx50
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":450.0,\"paid_gold\":0.0,\"free_gold\":450.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":3790.0}","o":null}
// {"c":10402,"s":0,"d":"{\"items\":[{\"itemId\":3300001,\"amount\":12},{\"itemId\":600002,\"amount\":2}]}","o":null}
// {"c":695,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":100.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":3300001,\"itemCount\":10},{\"itemId\":600002,\"itemCount\":2}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}}","o":"115"}

// -> {"c":695,"o":"120","p":{"code":"G123_vividarmy"}} // 300 diamonds, 5 red tickets, 2 VITx50
// {"c":10001,"s":0,"d":"{\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"soil\":0.0,\"gold\":750.0,\"paid_gold\":0.0,\"free_gold\":750.0,\"coal\":0.0,\"wood\":20000.0,\"military\":0.0,\"expedition_coin\":0.0,\"oila\":0.0,\"jungong\":0.0,\"coin\":3790.0}","o":null}
// {"c":10402,"s":0,"d":"{\"items\":[{\"itemId\":2100002,\"amount\":5},{\"itemId\":600002,\"amount\":4}]}","o":null}
// {"c":695,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":300.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[{\"itemId\":2100002,\"itemCount\":5},{\"itemId\":600002,\"itemCount\":2}],\"herosplit\":[],\"giftKey\":0,\"energy\":0}}","o":"120"}
