function default_1(durationMilliseconds) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, durationMilliseconds);
    });
}
exports["default"] = default_1;
