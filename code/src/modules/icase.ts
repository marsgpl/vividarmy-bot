export default function(value: number): number {
    value = Math.abs(value);

    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 0 || (mod10 > 4 && mod10 < 10) || (mod100 > 4 && mod100 < 20)) {
        return 0 // томатов
    } else if (mod10 === 1) {
        return 1 // томат
    } else {
        return 2 // томата
    }
}
