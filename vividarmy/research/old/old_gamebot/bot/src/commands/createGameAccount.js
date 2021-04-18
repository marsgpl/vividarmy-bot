const log = require('modules/log').setName('createGameAccount');

// {"code":"fXFSooFVsD8EWMTc0rNoNDyA60bxY6uRhoVCPA0AneaFKWfbtDgZt5WAGrPP6ewE","providers":[],"userId":"GGPHTIAA","isPlatformNewUser":true,"sessionKey":"IgEr5maX4rvnoQIZbo65IX4hyUEiMVDtLvPmJBaYQe9jIIOlWnnQzHVOkFNM9QoKEKtq1WiyJY28p3ZIl7o0g6ROdcthGe06aZnIFCgunzDqHzh2COhkKfTw5XwTiR9R7gNyga5uSF6gG8v4xzCi7YijgwXWnnykKMg57X3DwUm5IruXonTNiCzQQEPhnrVb3v0uBmBOjaxtXxaXDezocUo.6OVMQ7dCBx9axanwwmgfxo"}

module.exports = async function(ctx) {
    log('start');

    const { conf, browser } = ctx;

    const createSessionUrl = conf.vividarmy.sessionUrl
        .replace(':from:', encodeURIComponent(conf.vividarmy.shellUrl));

    const r = await browser.get(createSessionUrl, {
        referer: conf.vividarmy.shellUrl,
    });

    const accountData = JSON.parse(r.body);

    if (!accountData.userId || !accountData.code) {
        throw Error(`game account is invalid: ${r.body}`);
    }

    log(accountData.userId);
    log(accountData.code);

    return accountData;
};
