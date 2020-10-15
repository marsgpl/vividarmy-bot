function default_1(value, digits) {
    if (digits === void 0) { digits = 2; }
    var str = String(value);
    return str.length >= digits ? str : '0'.repeat(digits - str.length) + str;
}
exports["default"] = default_1;
