var getDateAsString_1 = require('modules/getDateAsString');
var getArgsAsString_1 = require('modules/getArgsAsString');
var log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var date = getDateAsString_1["default"]();
    var sep = '  ';
    var msg = getArgsAsString_1["default"](args);
    console.log(date + sep + msg);
};
log.setName = function (name) {
    return log.bind(log, name + ':');
};
exports["default"] = log;
