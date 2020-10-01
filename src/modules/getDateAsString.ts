import addz from 'modules/addz';

/**
 * 2018-06-19 02:38:17.369
 */
export default function(date?: Date): string {
    date = date || new Date;

    return date.getFullYear() +
        '-' + addz(date.getMonth() + 1) +
        '-' + addz(date.getDate()) +
        ' ' + addz(date.getHours()) +
        ':' + addz(date.getMinutes()) +
        ':' + addz(date.getSeconds()) +
        '.' + addz(date.getMilliseconds(), 3);
}
