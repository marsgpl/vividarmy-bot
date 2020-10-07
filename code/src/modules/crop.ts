export default function(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    } else {
        return value.substr(0, maxLength) + '...';
    }
}
