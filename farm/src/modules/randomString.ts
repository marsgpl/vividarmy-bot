import randomNumber from 'modules/randomNumber';

const randomString = function(length: number, alphabet: string[]): string {
    if (!alphabet) {
        throw Error(`invalid alphabet: ${JSON.stringify(alphabet)}`);
    }

    const result = Array<string>(length);

    for (let i = 0; i < length; ++i) {
        result[i] = alphabet[randomNumber(0, alphabet.length - 1)];
    }

    return result.join('');
};

randomString.alpha = {
    'azAZ09_': 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split(''),
};

export default randomString;
