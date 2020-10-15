function default_1(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }
    else {
        return value.substr(0, maxLength) + '...';
    }
}
exports["default"] = default_1;
