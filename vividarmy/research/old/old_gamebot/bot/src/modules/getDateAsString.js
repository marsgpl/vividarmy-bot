const addz = require('modules/addz');

// 2018-06-19 02:38:17.369
module.exports = function(date) {
    date = date || new Date;

    return date.getFullYear() +
        '-' + addz(date.getMonth() + 1) +
        '-' + addz(date.getDate()) +
        ' ' + addz(date.getHours()) +
        ':' + addz(date.getMinutes()) +
        ':' + addz(date.getSeconds()) +
        '.' + addz(date.getMilliseconds(), 3);
};
