import icase from 'modules/icase';

const DAYS_CASE = ['days', 'day', 'days'];
const HOURS_CASE = ['hours', 'hour', 'hours'];
const MINUTES_CASE = ['minutes', 'minute', 'minutes'];
const SECONDS_CASE = ['seconds', 'second', 'seconds'];

export default function(seconds: number): string {
    if (seconds <= 0) {
        return '';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds - days * 86400) / 3600);
    const minutes = Math.floor((seconds - days * 86400 - hours * 3600) / 60);
    seconds %= 60;

    const result = [
        days,
        DAYS_CASE[icase(days)],
        hours,
        HOURS_CASE[icase(hours)],
        minutes,
        MINUTES_CASE[icase(minutes)],
        seconds,
        SECONDS_CASE[icase(seconds)],
    ];

    const shiftsAmount = days ? 0 : hours ? 2 : minutes ? 4 : 6;

    for (let i = 0; i < shiftsAmount; ++i) {
        result.shift();
    }

    return result.join(' ');
}
