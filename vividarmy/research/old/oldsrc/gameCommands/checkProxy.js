const log = require('modules/log').setName('checkProxy');

module.exports = async function(ctx) {
    log('start');

    const { config, browser } = ctx;

    const r = await browser.get(config.checkProxy.url);

    const expected = JSON.stringify(config.checkProxy.expectedAnswer);
    const received = JSON.stringify(r.body);

    if (received !== expected) {
        throw Error(`expected: ${expected}; received: ${received}`);
    }

    const cc = r.body.match(/\((.*?)\)/)[1];

    log(cc);
};
