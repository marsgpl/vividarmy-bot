module.exports = function(variable, entryType) {
    return Array.isArray(variable) && variable.every(entry => typeof entry === entryType);
};
