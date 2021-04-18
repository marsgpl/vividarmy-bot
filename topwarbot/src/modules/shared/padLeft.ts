const DEFAULT_PAD_WITH = '0';

const padLeft = function(
    value: string | number,
    padWith: string = DEFAULT_PAD_WITH,
    finalMinLength: number = 2,
): string {
    value = String(value);
    padWith = padWith || DEFAULT_PAD_WITH;

    if (value.length >= finalMinLength) {
        return value;
    }

    const padLength = finalMinLength - value.length;
    const timesToRepeat = Math.ceil(padLength / padWith.length);


    return padWith.repeat(timesToRepeat).substr(0, padLength) + value;
}

export default padLeft;
