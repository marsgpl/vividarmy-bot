const log = require('modules/log').setName('checkProxy');

module.exports = async function(ctx) {
    log('start');

    const { conf, browser } = ctx;

    const r = await browser.get(conf.checkProxy.url);

    const expected = JSON.stringify(conf.checkProxy.expectedAnswer);
    const received = JSON.stringify(r.body);

    if (received !== expected) {
        throw Error(`expected: ${expected}; received: ${received}`);
    }

    const cc = r.body.match(/\((.*?)\)/)[1];

    log(cc);
};
