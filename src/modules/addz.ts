export default function(value: number, digits: number = 2): string {
    const str = String(value);
    return str.length >= digits ? str : '0'.repeat(digits - str.length) + str;
}
