export default function(value: string): string {
    return Buffer.from(value).toString('base64');
}
