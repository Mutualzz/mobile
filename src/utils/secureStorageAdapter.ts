import * as SecureStore from "expo-secure-store";

const TRACKED_KEYS = new Set<string>();

function track(key: string) {
    TRACKED_KEYS.add(key);
}

export const secureStorageAdapter: Storage = {
    getItem: (key: string) => {
        track(key);
        return SecureStore.getItem(key);
    },
    setItem: (key: string, value: string) => {
        track(key);
        SecureStore.setItem(key, value);
        return value;
    },
    removeItem: (key: string) => {
        TRACKED_KEYS.delete(key);
        void SecureStore.deleteItemAsync(key);
    },
    clear: () => {
        for (const key of Array.from(TRACKED_KEYS)) {
            TRACKED_KEYS.delete(key);
            void SecureStore.deleteItemAsync(key);
        }
    },
    key: (index: number) => {
        const keys = Array.from(TRACKED_KEYS);
        return keys[index] ?? null;
    },
    get length() {
        return TRACKED_KEYS.size;
    },
};
