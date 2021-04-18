const log = require('modules/log').setName('getClientVersion');

// 1.120.0|NO_FORCE_UPDATE

module.exports = async function(ctx) {
    log('start');

    const { conf, browser } = ctx;

    const getClientVersionUrl = conf.vividarmy.clientVersionUrl
        .replace(':ts:', Date.now());

    const r = await browser.get(getClientVersionUrl, {
        referer: conf.vividarmy.clientVersionUrl_referer,
    });

    const [value, notes] = r.body.split('|');

    log(value);

    return { value, notes };
};
