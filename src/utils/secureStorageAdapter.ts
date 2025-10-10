import * as secureStorage from "expo-secure-store";

export const secureStorageAdapter: Storage = {
    getItem: (key: string) => secureStorage.getItem(key) as string | null,
    setItem: (key: string, value: string) => {
        secureStorage.setItem(key, value);
        return value;
    },
    removeItem: (key: string) => {
        secureStorage.deleteItemAsync(key);
    },
    clear: () => {
        Object.keys(secureStorage).forEach((key) => {
            secureStorage.deleteItemAsync(key);
        });
    },
    key: (index: number) => {
        const keys = Object.keys(secureStorage);
        return keys[index] ?? null;
    },
    get length() {
        return Object.keys(secureStorage).length;
    },
};
