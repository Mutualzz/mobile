import secureLocalStorage from "react-secure-storage";

export const secureStorageAdapter: Storage = {
    getItem: (key: string) => secureLocalStorage.getItem(key) as string | null,
    setItem: (key: string, value: string) => {
        secureLocalStorage.setItem(key, value);
        return value;
    },
    removeItem: (key: string) => {
        secureLocalStorage.removeItem(key);
    },
    clear: () => {
        secureLocalStorage.clear();
    },
    key: (index: number) => {
        const keys = Object.keys(secureLocalStorage);
        return keys[index] ?? null;
    },
    get length() {
        return Object.keys(secureLocalStorage).length;
    },
};
