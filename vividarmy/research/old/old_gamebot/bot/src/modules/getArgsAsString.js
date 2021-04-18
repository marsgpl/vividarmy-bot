module.exports = function(args) {
    return Array.prototype.slice.call(args).map(arg => {
        if (arg instanceof Error) {
            if (arg.stack) {
                return arg.stack.toString().split(/\s*\n\s*/).join('\n  -> ');
            } else {
                return '#' + String(arg.code || '?') + ': ' + String(arg.message || '?');
            }
        } else if (typeof arg === 'object') {
            return JSON.stringify(arg);
        } else {
            return String(arg);
        }
    }).join(' ');
};
