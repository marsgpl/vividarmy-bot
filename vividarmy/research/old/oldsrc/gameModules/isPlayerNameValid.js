module.exports = name => {
    if (name.length > 8) return false;
    if (name.length < 1) return false;
    return true;
};
