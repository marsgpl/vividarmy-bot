const getDateAsString = require('modules/getDateAsString');
const getArgsAsString = require('modules/getArgsAsString');

const log = function(/*...*/) {
    const date = getDateAsString();
    const sep = '  ';
    const msg = getArgsAsString(arguments);

    console.log(date + sep + msg);
};

log.setName = function(name) {
    return log.bind(log, name + ':');
};

module.exports = log;
