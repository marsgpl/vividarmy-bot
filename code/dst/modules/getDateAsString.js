var addz_1 = require('modules/addz');
/**
 * 2018-06-19 02:38:17.369
 */
function default_1(date) {
    date = date || new Date;
    return date.getFullYear() +
        '-' + addz_1["default"](date.getMonth() + 1) +
        '-' + addz_1["default"](date.getDate()) +
        ' ' + addz_1["default"](date.getHours()) +
        ':' + addz_1["default"](date.getMinutes()) +
        ':' + addz_1["default"](date.getSeconds()) +
        '.' + addz_1["default"](date.getMilliseconds(), 3);
}
exports["default"] = default_1;
