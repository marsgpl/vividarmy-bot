function default_1(args, separator) {
    if (separator === void 0) { separator = ' '; }
    return Array.prototype.slice.call(args).map(function (arg) {
        if (arg instanceof Error) {
            if (arg.stack) {
                return arg.stack.split(/\s*\n\s*/).join('\n  -> ');
            }
            else {
                return arg.message;
            }
        }
        else if (typeof arg === 'object') {
            return JSON.stringify(arg);
        }
        else {
            return String(arg);
        }
    }).join(separator);
}
exports["default"] = default_1;
