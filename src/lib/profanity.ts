import { Filter } from 'bad-words';

const filter = new Filter();

export function cleanText(text: string): string {
    try {
        return filter.clean(text);
    } catch (error) {
        return text;
    }
}
