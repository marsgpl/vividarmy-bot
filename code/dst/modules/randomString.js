var randomNumber_1 = require('modules/randomNumber');
var randomString = function (length, alphabet) {
    if (!alphabet) {
        throw Error("invalid alphabet: " + JSON.stringify(alphabet));
    }
    var result = Array(length);
    for (var i = 0; i < length; ++i) {
        result[i] = alphabet[randomNumber_1["default"](0, alphabet.length - 1)];
    }
    return result.join('');
};
randomString.alpha = {
    'azAZ09_': 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('')
};
exports["default"] = randomString;
