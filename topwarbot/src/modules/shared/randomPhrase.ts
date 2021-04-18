import randomNumber from 'modules/randomNumber';

export default function(phrases: string[]): string {
    return phrases[randomNumber(0, phrases.length - 1)];
}
