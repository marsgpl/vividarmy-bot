export default function(args: IArguments | any[], separator: string = ' '): string {
    return Array.prototype.slice.call(args).map(arg => {
        if (arg instanceof Error) {
            if (arg.stack) {
                return arg.stack.split(/\s*\n\s*/).join('\n  -> ');
            } else {
                return arg.message;
            }
        } else if (typeof arg === 'object') {
            return JSON.stringify(arg);
        } else {
            return String(arg);
        }
    }).join(separator);
}
