export default function(durationMilliseconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, durationMilliseconds);
    });
}
