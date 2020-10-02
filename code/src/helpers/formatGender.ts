const ID_TO_LABEL: {[key: number]: string} = {
    [0]: 'undefined (0)',
    [1]: 'male',
    [2]: 'female',
};

export default function(gender: number): string {
    return ID_TO_LABEL[gender] || 'unknown';
};
