const cache: {[key: string]: {[value: string]: true}} = {};

const unique = function(key: string, value: any): any {
    if (!cache[key]) {
        cache[key] = {};
    }

    value = String(value);

    if (cache[key][value]) {
        throw Error(`value ${value} is not unique for key ${key}`);
    }

    cache[key][value] = true;

    return value;
};

export default unique;
