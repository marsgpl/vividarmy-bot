module.exports = function(n, digits = 2) {
    n = String(n);
    return n.length >= digits ? n : '0'.repeat(digits - n.length) + n;
};
