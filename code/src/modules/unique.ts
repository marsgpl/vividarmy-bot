const cache: {[key: string]: true} = {};

const unique = function(key: any): any {
    if (cache[key]) {
        throw Error(`key "${key}" is not unique`);
    }

    cache[key] = true;

    return key;
};

export default unique;
