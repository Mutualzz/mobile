import { AppStore } from "@stores/App.store";

export const appStore = new AppStore();

export function useAppStore() {
    return appStore;
}
