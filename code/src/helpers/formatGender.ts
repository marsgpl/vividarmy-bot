const ID_TO_LABEL: {[key: number]: string} = {
    [1]: 'male',
    [2]: 'female',
};

export default function(gender: number): string {
    return gender && ID_TO_LABEL[gender] || '?';
};
