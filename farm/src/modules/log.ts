import getDateAsString from 'modules/getDateAsString';
import getArgsAsString from 'modules/getArgsAsString';

const log = function(...args: any[]): void {
    const date = getDateAsString();
    const sep = '  ';
    const msg = getArgsAsString(args);

    console.log(date + sep + msg);
};

log.setName = function(name: string): Function {
    return log.bind(log, name + ':');
};

export default log;
