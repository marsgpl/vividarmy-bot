const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

module.exports = async function(pathToConfFile) {
    const content = await readFile(pathToConfFile, {
        encoding: 'utf-8',
    });

    const conf = JSON.parse(content);

    if (typeof conf !== 'object') {
        throw Error(`invalid conf content: ${content}`);
    }

    return conf;
};
