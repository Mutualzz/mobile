import { makeAutoObservable } from "mobx";
import type {
    CustomStatusSchedule,
    CustomStatusSnapshot,
    PresenceActivity,
    PresenceActivityEmoji,
} from "@mutualzz/types";
import { hasCustomStatusContent } from "@mutualzz/client";
import { makePersistable } from "mobx-persist-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class CustomStatusStore {
    private static readonly LOCAL_CLEAR_GUARD_MS = 5000;

    text: string = "";
    emoji: PresenceActivityEmoji | null = null;
    enabled: boolean = false;
    scheduledCustomStatus: CustomStatusSchedule | null = null;
    onScheduledCustomStatusExpire?: (schedule: CustomStatusSchedule) => void;

    private scheduledTimer: ReturnType<typeof setTimeout> | null = null;
    private localClearAt: number | null = null;

    constructor() {
        makeAutoObservable(this);

        makePersistable(this, {
            name: "CustomStatusStore",
            properties: ["text", "emoji", "enabled", "scheduledCustomStatus"],
            storage: AsyncStorage,
        });
    }

    get effectiveText(): string {
        const scheduled = this.scheduledCustomStatus;
        if (scheduled && scheduled.until > Date.now()) return scheduled.text;

        return this.enabled ? this.text : "";
    }

    get effectiveEmoji(): PresenceActivityEmoji | null {
        const scheduled = this.scheduledCustomStatus;
        if (scheduled && scheduled.until > Date.now()) return scheduled.emoji;

        return this.enabled ? this.emoji : null;
    }

    get activity(): PresenceActivity | null {
        const text = this.effectiveText;
        const emoji = this.effectiveEmoji;

        if (!hasCustomStatusContent(text, emoji)) return null;

        return {
            type: "custom",
            name: "",
            state: text,
            ...(emoji ? { emoji } : {}),
        };
    }

    set(text: string, emoji?: PresenceActivityEmoji | null) {
        this.localClearAt = null;
        this.text = text.trim();
        if (emoji !== undefined) this.emoji = emoji;
        this.enabled = hasCustomStatusContent(this.text, this.emoji);
    }

    setSnapshot(snapshot: CustomStatusSnapshot) {
        this.localClearAt = null;
        this.text = snapshot.text?.trim() ?? "";
        this.emoji = snapshot.emoji ?? null;
        this.enabled = hasCustomStatusContent(this.text, this.emoji);
    }

    clear() {
        this.text = "";
        this.emoji = null;
        this.enabled = false;
        this.scheduledCustomStatus = null;
        this.localClearAt = Date.now();

        if (this.scheduledTimer) {
            clearTimeout(this.scheduledTimer);
            this.scheduledTimer = null;
        }
    }

    setScheduledCustomStatus(schedule: CustomStatusSchedule | null) {
        if (schedule && schedule.until > Date.now()) {
            if (
                this.localClearAt &&
                Date.now() - this.localClearAt <
                    CustomStatusStore.LOCAL_CLEAR_GUARD_MS
            ) {
                return;
            }

            this.scheduledCustomStatus = schedule;
            this.text = schedule.text;
            this.emoji = schedule.emoji;
            this.enabled = hasCustomStatusContent(schedule.text, schedule.emoji);
            this.rearmScheduledCustomStatusTimer();
            return;
        }

        this.scheduledCustomStatus = null;
        if (this.scheduledTimer) {
            clearTimeout(this.scheduledTimer);
            this.scheduledTimer = null;
        }
    }

    syncFromPresenceActivity(activity: PresenceActivity | null) {
        if (
            this.scheduledCustomStatus &&
            this.scheduledCustomStatus.until > Date.now()
        )
            return;

        const hasIncomingCustom =
            activity?.type === "custom" &&
            hasCustomStatusContent(
                activity.state?.trim() || activity.name?.trim() || "",
                activity.emoji ?? null
            );

        if (
            this.localClearAt &&
            Date.now() - this.localClearAt < CustomStatusStore.LOCAL_CLEAR_GUARD_MS
        ) {
            if (hasIncomingCustom) return;
            this.localClearAt = null;
        }

        if (!hasIncomingCustom) {
            this.text = "";
            this.emoji = null;
            this.enabled = false;
            return;
        }

        this.setSnapshot({
            text: activity!.state?.trim() || activity!.name?.trim() || null,
            emoji: activity!.emoji ?? null,
        });
    }

    rearmScheduledCustomStatusTimer() {
        if (this.scheduledTimer) {
            clearTimeout(this.scheduledTimer);
            this.scheduledTimer = null;
        }

        const schedule = this.scheduledCustomStatus;
        if (!schedule) return;

        const now = Date.now();
        const delay = schedule.until - now;

        if (delay <= 0) {
            this.finishScheduledCustomStatus(schedule);
            return;
        }

        this.scheduledTimer = setTimeout(() => {
            this.scheduledTimer = null;
            this.finishScheduledCustomStatus(schedule);
        }, delay);
    }

    private finishScheduledCustomStatus(schedule: CustomStatusSchedule) {
        this.scheduledCustomStatus = null;
        this.onScheduledCustomStatusExpire?.(schedule);
    }
}
