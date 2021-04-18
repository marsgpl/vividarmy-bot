const rnd = require('modules/rnd');

const randomString = function(length, alpha) {
    if (!alpha) {
        throw Error(`randomString alphabet is invalid: ${alpha}`);
    }

    const result = Array(length);

    for (let i = 0; i < length; ++i) {
        result[i] = alpha[rnd(0, alpha.length - 1)];
    }

    return result.join('');
};

randomString.alpha = {};

randomString.alpha.azAZ09_ = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('');

module.exports = randomString;
