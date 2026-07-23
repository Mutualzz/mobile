import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "RecentEmojiStore";
const MAX_RECENT = 24;

export type RecentEmojiType = "standard" | "custom";

export interface RecentEmoji {
    type: RecentEmojiType;
    unified?: string;
    skinTone?: string | null;
    id?: string;
    name?: string;
    url?: string;
    animated?: boolean;
}

async function loadRecent(): Promise<RecentEmoji[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as RecentEmoji[]) : [];
    } catch {
        return [];
    }
}

async function saveRecent(recents: RecentEmoji[]) {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
    } catch {
    }
}

export async function clearRecentEmojisStorage() {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
    }
}

export function useRecentEmojis() {
    const [recents, setRecents] = useState<RecentEmoji[]>([]);

    useEffect(() => {
        void loadRecent().then(setRecents);
    }, []);

    useEffect(() => {
        if (recents.length === 0) return;
        void saveRecent(recents);
    }, [recents]);

    const addRecentStandard = useCallback(
        (unified: string, skinTone: string | null = null) => {
            setRecents((prev) => {
                const filtered = prev.filter(
                    (entry) =>
                        !(
                            entry.type === "standard" &&
                            entry.unified === unified &&
                            entry.skinTone === skinTone
                        ),
                );
                return [
                    { type: "standard" as const, unified, skinTone },
                    ...filtered,
                ].slice(0, MAX_RECENT);
            });
        },
        [],
    );

    const addRecentCustom = useCallback(
        (id: string, name: string, url: string, animated: boolean) => {
            setRecents((prev) => {
                const filtered = prev.filter(
                    (entry) => !(entry.type === "custom" && entry.id === id),
                );
                return [
                    {
                        type: "custom" as const,
                        id,
                        name,
                        url,
                        animated,
                    },
                    ...filtered,
                ].slice(0, MAX_RECENT);
            });
        },
        [],
    );

    const clearRecents = useCallback(() => {
        void clearRecentEmojisStorage();
        setRecents([]);
    }, []);

    return { recents, addRecentStandard, addRecentCustom, clearRecents };
}
