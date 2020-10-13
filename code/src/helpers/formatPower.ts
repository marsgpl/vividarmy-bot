const ZEROES_TO_SUFFIX: {[key: number]: string} = {
    [3]: 'k', // 1000
    [6]: 'M', // 1000000
    [9]: 'B',
    [12]: 'T',
    [15]: 'aa',
    [18]: 'bb',
    [21]: 'cc',
    [24]: 'dd',
    [27]: 'ee',
    [30]: 'ff',
    [33]: 'gg',
};

export default function(power: number): string {
    let value = String(power);
    let suffix = '';

    for (let zeroes = 3; zeroes <= 33; zeroes += 3) {
        const borderline = Math.pow(10, zeroes);

        if (power < borderline) {
            return value + suffix;
        }

        value = (power / borderline).toFixed(2);
        suffix = ZEROES_TO_SUFFIX[zeroes];
    }

    return power.toFixed(2); // too big
};
