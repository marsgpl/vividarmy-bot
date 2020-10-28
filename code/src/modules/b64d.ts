export default function(value: string): string {
    return Buffer.from(value, 'base64').toString('utf8');
}
