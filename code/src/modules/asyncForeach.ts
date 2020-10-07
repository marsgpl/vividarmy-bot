type Callback<T> = (value: T, index?: number, array?: Array<T>) => Promise<void>;

export default async function<T>(array: Array<T>, callback: Callback<T>): Promise<void> {
    for (let index = 0; index < array.length; ++index) {
        await callback(array[index], index, array);
    }
}
