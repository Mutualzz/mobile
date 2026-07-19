import {
  CALL_SOLO_TIMEOUT_MS,
  GatewayOpcodes,
  type APICall,
  type Snowflake,
} from "@mutualzz/types";
import type { AppStore } from "@stores/App.store";
import { dismissCallNotification } from "@utils/androidMessageNotification";
import { makeAutoObservable, observable, runInAction } from "mobx";

function cloneCall(call: APICall): APICall {
  return {
    ...call,
    ringing: [...call.ringing],
    accepted: [...call.accepted],
  };
}

export class CallStore {
  callsByChannel = observable.map<string, APICall>();
  private dismissedChannels = new Map<string, number>();
  private pendingCancelChannels = new Set<string>();

  constructor(private readonly app: AppStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getCall(channelId: Snowflake) {
    return this.callsByChannel.get(String(channelId)) ?? null;
  }

  private dismissChannel(channelId: Snowflake) {
    this.dismissedChannels.set(String(channelId), Date.now());
  }

  private clearDismissed(channelId: Snowflake) {
    this.dismissedChannels.delete(String(channelId));
  }

  private markPendingCancel(channelId: Snowflake) {
    const key = String(channelId);
    this.pendingCancelChannels.add(key);
    this.dismissChannel(key);
  }

  private clearPendingCancel(channelId: Snowflake) {
    this.pendingCancelChannels.delete(String(channelId));
  }

  private isDismissed(channelId: Snowflake, call?: APICall | null) {
    const key = String(channelId);
    if (this.pendingCancelChannels.has(key)) return true;
    const dismissedAt = this.dismissedChannels.get(key);
    if (dismissedAt == null) return false;
    if (call && call.createdAt > dismissedAt) return false;
    return true;
  }

  private async flushPendingCancel(call: APICall) {
    const channelId = String(call.channelId);
    if (!this.pendingCancelChannels.has(channelId)) return false;

    const selfId = this.app.account?.id;
    if (!selfId || String(call.initiatorId) !== String(selfId)) {
      this.clearPendingCancel(channelId);
      return false;
    }

    this.dismissChannel(channelId);
    try {
      await this.app.gateway.send({
        op: GatewayOpcodes.CallRespond,
        d: {
          callId: call.id,
          action: "cancel",
        },
      });
      this.clearPendingCancel(channelId);
    } catch {
      return true;
    }
    return true;
  }

  isRingingForMe(channelId: Snowflake) {
    const call = this.getCall(channelId);
    const selfId = this.app.account?.id;
    if (!call || !selfId || !Array.isArray(call.ringing)) return false;
    return call.ringing.includes(String(selfId));
  }

  getIncomingRingingChannelId() {
    const selfId = this.app.account?.id;
    if (!selfId) return null;
    const status =
      this.app.presence.get(String(selfId))?.status ?? "online";
    if (status === "dnd") return null;
    for (const call of this.callsByChannel.values()) {
      if (call.status === "ended") continue;
      if (
        Array.isArray(call.ringing) &&
        call.ringing.includes(String(selfId))
      ) {
        return String(call.channelId);
      }
    }
    return null;
  }

  getOutgoingRingingChannelId() {
    const selfId = this.app.account?.id;
    if (!selfId) return null;
    for (const call of this.callsByChannel.values()) {
      if (call.status === "ended") continue;
      if (
        String(call.initiatorId) === String(selfId) &&
        Array.isArray(call.ringing) &&
        call.ringing.length > 0
      ) {
        return String(call.channelId);
      }
    }
    return null;
  }

  isOutgoing(channelId: Snowflake) {
    const call = this.getCall(channelId);
    const selfId = this.app.account?.id;
    if (!call || !selfId || !Array.isArray(call.ringing)) return false;
    return (
      String(call.initiatorId) === String(selfId) &&
      call.ringing.length > 0
    );
  }

  isActive(channelId: Snowflake) {
    const call = this.getCall(channelId);
    return !!call && call.status !== "ended";
  }

  hydrate(calls: APICall[] | undefined) {
    const previousChannelIds = new Set(this.callsByChannel.keys());
    this.dismissedChannels.clear();
    this.pendingCancelChannels.clear();
    this.callsByChannel.clear();
    for (const call of calls ?? []) {
      if (call.status === "ended") continue;
      const channelId = String(call.channelId);
      previousChannelIds.delete(channelId);
      this.callsByChannel.set(channelId, {
        ...call,
        ringing: Array.isArray(call.ringing) ? call.ringing : [],
        accepted: Array.isArray(call.accepted) ? call.accepted : [],
      });
    }
    for (const channelId of previousChannelIds) {
      this.app.voice.onRemoteCallEnded(channelId);
    }
  }

  onCallCreate(call: APICall) {
    if (call.status === "ended") return;
    const channelId = String(call.channelId);
    if (this.pendingCancelChannels.has(channelId)) {
      const selfId = this.app.account?.id;
      if (selfId && String(call.initiatorId) === String(selfId)) {
        void this.flushPendingCancel(call);
        return;
      }
      this.clearPendingCancel(channelId);
    }
    if (this.isDismissed(call.channelId, call)) return;
    this.clearDismissed(call.channelId);
    this.callsByChannel.set(channelId, {
      ...call,
      ringing: Array.isArray(call.ringing) ? call.ringing : [],
      accepted: Array.isArray(call.accepted) ? call.accepted : [],
    });
  }

  onCallUpdate(call: APICall) {
    if (call.status === "ended") {
      this.onCallDelete(call);
      return;
    }

    const channelId = String(call.channelId);
    if (this.pendingCancelChannels.has(channelId)) {
      const selfId = this.app.account?.id;
      if (selfId && String(call.initiatorId) === String(selfId)) {
        void this.flushPendingCancel(call);
        return;
      }
      this.clearPendingCancel(channelId);
    }

    if (this.isDismissed(call.channelId, call)) return;

    const selfId = this.app.account?.id;
    const previous = selfId ? this.getCall(channelId) : null;

    this.callsByChannel.set(channelId, {
      ...call,
      ringing: Array.isArray(call.ringing) ? call.ringing : [],
      accepted: Array.isArray(call.accepted) ? call.accepted : [],
    });

    if (!selfId || !previous) return;

    const uid = String(selfId);
    const next = this.getCall(channelId);
    if (!next) return;
    const wasIn =
      previous.accepted.includes(uid) || previous.ringing.includes(uid);
    const stillIn =
      next.accepted.includes(uid) || next.ringing.includes(uid);
    if (wasIn && !stillIn) {
      const joiningHere =
        String(this.app.voice.currentChannelId) === channelId &&
        this.app.voice.connectionStatus === "connecting";
      if (joiningHere) return;
      this.app.voiceStates.remove(uid);
      this.app.voice.onRemoteCallEnded(channelId);
    }
  }

  onCallDelete(call: APICall & { reason?: string }) {
    const channelId = String(call.channelId);
    const personalLeave = call.reason === "left_channel";
    const selfId = this.app.account?.id;

    if (personalLeave) {
      const existing = this.getCall(channelId);
      if (existing && existing.status !== "ended" && selfId) {
        const uid = String(selfId);
        this.callsByChannel.set(channelId, {
          ...existing,
          ringing: existing.ringing.filter((id) => String(id) !== uid),
          accepted: existing.accepted.filter((id) => String(id) !== uid),
        });
      }
      if (selfId) this.app.voiceStates.remove(selfId);
      this.app.voice.onRemoteCallEnded(channelId);
      return;
    }

    this.dismissedChannels.delete(channelId);
    this.clearPendingCancel(channelId);
    this.callsByChannel.delete(channelId);

    for (const state of this.app.voiceStates.getAllByChannel(channelId)) {
      this.app.voiceStates.remove(state.userId);
    }

    this.app.voice.onRemoteCallEnded(channelId);
  }

  private preferredMutePayload() {
    const preferredSelfMute = this.app.settings?.preferredSelfMute ?? false;
    const preferredSelfDeaf = this.app.settings?.preferredSelfDeaf ?? false;
    return {
      selfMute: preferredSelfMute || preferredSelfDeaf,
      selfDeaf: preferredSelfDeaf,
    };
  }

  private recipientIdsForChannel(channelId: Snowflake) {
    const channel = this.app.channels.get(channelId);
    if (!channel) return [] as string[];
    if (channel.dmRecipients.length > 0) {
      return channel.dmRecipients.map((user) => String(user.id));
    }
    return (channel.recipientIds ?? []).map(String);
  }

  async startCall(channelId: Snowflake, options?: { silent?: boolean }) {
    const selfId = this.app.account?.id;
    const silent = options?.silent === true;
    const key = String(channelId);
    this.clearPendingCancel(key);
    this.clearDismissed(key);

    if (selfId && !this.getCall(channelId)) {
      const ringing = silent
        ? []
        : this.recipientIdsForChannel(channelId).filter(
            (id) => id !== String(selfId),
          );
      runInAction(() => {
        this.callsByChannel.set(key, {
          id: `pending:${key}`,
          channelId: key,
          initiatorId: String(selfId),
          status: silent || ringing.length === 0 ? "active" : "ringing",
          silent,
          ringing,
          accepted: [String(selfId)],
          createdAt: Date.now(),
          aloneSince: Date.now(),
          soloTimeoutMs: CALL_SOLO_TIMEOUT_MS,
          connected: false,
        });
      });
    }

    this.app.voice.primeJoin({
      spaceId: null,
      channelId: key,
    });

    void this.app.gateway
      .send({
        op: GatewayOpcodes.CallCreate,
        d: {
          channelId: key,
          silent,
          ...this.preferredMutePayload(),
        },
      })
      .catch(() => {
        this.revertOptimisticJoin(channelId);
      });
  }

  async accept(channelId: Snowflake) {
    const call = this.getCall(channelId);
    if (!call) return;

    const selfId = this.app.account?.id;
    const snapshot = cloneCall(call);
    this.clearPendingCancel(channelId);
    this.clearDismissed(channelId);

    if (selfId) {
      runInAction(() => {
        const current = this.getCall(channelId);
        if (!current) return;
        const uid = String(selfId);
        this.callsByChannel.set(String(channelId), {
          ...current,
          status: "active",
          ringing: current.ringing.filter((id) => String(id) !== uid),
          accepted: current.accepted.includes(uid)
            ? current.accepted
            : [...current.accepted, uid],
        });
      });
    }

    this.app.voice.primeJoin({
      spaceId: null,
      channelId: String(channelId),
    });

    void dismissCallNotification(String(channelId));

    try {
      await this.app.gateway.send({
        op: GatewayOpcodes.CallRespond,
        d: {
          callId: call.id,
          action: "accept",
          ...this.preferredMutePayload(),
        },
      });
    } catch {
      runInAction(() => {
        this.callsByChannel.set(String(channelId), snapshot);
      });
    }
  }

  async decline(channelId: Snowflake) {
    const call = this.getCall(channelId);
    if (!call) return;

    const selfId = this.app.account?.id;
    if (!selfId) return;
    const uid = String(selfId);
    const snapshot = cloneCall(call);
    const isInitiator = String(call.initiatorId) === uid;
    const inAccepted = call.accepted.includes(uid);
    const othersRemain =
      call.accepted.some((id) => String(id) !== uid) ||
      call.ringing.some((id) => String(id) !== uid);

    void dismissCallNotification(String(channelId));

    this.app.sounds.play("call_decline");

    runInAction(() => {
      if (!isInitiator) {
        if (inAccepted && othersRemain) {
          this.callsByChannel.set(String(channelId), {
            ...call,
            ringing: call.ringing.filter((id) => String(id) !== uid),
            accepted: call.accepted.filter((id) => String(id) !== uid),
          });
          return;
        }
        this.dismissChannel(channelId);
        this.callsByChannel.delete(String(channelId));
        return;
      }
      const current = this.getCall(channelId);
      if (!current) return;
      this.callsByChannel.set(String(channelId), {
        ...current,
        ringing: current.ringing.filter((id) => String(id) !== uid),
        accepted: current.accepted.filter((id) => String(id) !== uid),
      });
    });

    try {
      await this.app.gateway.send({
        op: GatewayOpcodes.CallRespond,
        d: {
          callId: call.id,
          action: "decline",
        },
      });
    } catch {
      runInAction(() => {
        this.callsByChannel.set(String(channelId), snapshot);
        this.clearDismissed(channelId);
      });
    }
  }

  async cancel(channelId: Snowflake) {
    const call = this.getCall(channelId);
    const selfId = this.app.account?.id;
    const callId = call?.id ?? `pending:${String(channelId)}`;

    if (!call) {
      this.markPendingCancel(channelId);
      try {
        await this.app.gateway.send({
          op: GatewayOpcodes.CallRespond,
          d: {
            callId,
            action: "cancel",
          },
        });
      } catch {
        return;
      }
      return;
    }

    const snapshot = cloneCall(call);
    const othersInVoice = this.app.voiceStates
      .getAllByChannel(channelId)
      .filter((state) => !selfId || String(state.userId) !== String(selfId));

    runInAction(() => {
      if (othersInVoice.length > 0) {
        this.callsByChannel.set(String(channelId), {
          ...call,
          ringing: [],
          status: "active",
          connected: true,
        });
        return;
      }
      this.markPendingCancel(channelId);
      this.callsByChannel.delete(String(channelId));
    });

    if (othersInVoice.length > 0) {
      try {
        await this.app.gateway.send({
          op: GatewayOpcodes.CallRespond,
          d: {
            callId: call.id,
            action: "cancel",
          },
        });
      } catch {
        runInAction(() => {
          this.callsByChannel.set(String(channelId), snapshot);
          this.clearDismissed(channelId);
          this.clearPendingCancel(channelId);
        });
      }
      return;
    }

    try {
      await this.app.gateway.send({
        op: GatewayOpcodes.CallRespond,
        d: {
          callId: call.id,
          action: "cancel",
        },
      });
      this.clearPendingCancel(channelId);
    } catch {
      runInAction(() => {
        this.callsByChannel.set(String(channelId), snapshot);
        this.clearDismissed(channelId);
        this.clearPendingCancel(channelId);
      });
    }
  }

  async endOnVoiceLeave(channelId: Snowflake) {
    const selfId = this.app.account?.id;
    const othersInVoice = this.app.voiceStates
      .getAllByChannel(channelId)
      .filter((state) => !selfId || String(state.userId) !== String(selfId));

    if (othersInVoice.length > 0) return;

    const call = this.getCall(channelId);
    if (call && selfId) {
      const uid = String(selfId);
      if (String(call.initiatorId) === uid) {
        await this.cancel(channelId);
        return;
      }
      if (call.accepted.includes(uid) || call.ringing.includes(uid)) {
        await this.abandon(channelId);
        return;
      }
    }

    await this.cancel(channelId);
  }

  async endOnJoinFail(channelId: Snowflake) {
    const call = this.getCall(channelId);
    const selfId = this.app.account?.id;
    if (call && selfId) {
      const uid = String(selfId);
      if (String(call.initiatorId) === uid) {
        await this.cancel(channelId);
        return;
      }
      await this.abandon(channelId);
      return;
    }
    await this.cancel(channelId);
  }

  async abandon(channelId: Snowflake) {
    const call = this.getCall(channelId);
    if (!call) return;

    const selfId = this.app.account?.id;
    if (!selfId) {
      runInAction(() => {
        this.callsByChannel.delete(String(channelId));
      });
      return;
    }

    const uid = String(selfId);
    const isInitiator = String(call.initiatorId) === uid;
    const inRinging = call.ringing.includes(uid);
    const inAccepted = call.accepted.includes(uid);
    if (!isInitiator && !inRinging && !inAccepted) {
      return;
    }

    const looksLikeFailedAccept =
      !isInitiator && !inRinging && inAccepted && call.status === "active";

    if (isInitiator) {
      const othersInVoice = this.app.voiceStates
        .getAllByChannel(channelId)
        .filter((state) => String(state.userId) !== uid);
      const otherAccepted = call.accepted.filter(
        (id) => String(id) !== uid,
      );
      const shouldCancel =
        othersInVoice.length === 0 && otherAccepted.length === 0;

      if (shouldCancel) {
        await this.cancel(channelId);
        return;
      }

      runInAction(() => {
        const current = this.getCall(channelId);
        if (!current) return;
        this.callsByChannel.set(String(channelId), {
          ...current,
          accepted: current.accepted.filter((id) => String(id) !== uid),
        });
      });
      await this.app.gateway.send({
        op: GatewayOpcodes.CallRespond,
        d: {
          callId: call.id,
          action: "decline",
        },
      });
      return;
    }

    if (inRinging || looksLikeFailedAccept || inAccepted) {
      await this.decline(channelId);
      return;
    }

    runInAction(() => {
      this.callsByChannel.delete(String(channelId));
    });
  }

  revertOptimisticJoin(channelId: Snowflake) {
    const call = this.getCall(channelId);
    const selfId = this.app.account?.id;
    if (!call || !selfId) return;

    const uid = String(selfId);
    const isInitiator = String(call.initiatorId) === uid;

    runInAction(() => {
      const current = this.getCall(channelId);
      if (!current) return;

      if (isInitiator) {
        const otherAccepted = current.accepted.filter(
          (id) => String(id) !== uid,
        );
        const othersInVoice = this.app.voiceStates
          .getAllByChannel(channelId)
          .filter((state) => String(state.userId) !== uid);
        if (otherAccepted.length === 0 && othersInVoice.length === 0) {
          this.callsByChannel.delete(String(channelId));
          return;
        }
        this.callsByChannel.set(String(channelId), {
          ...current,
          accepted: otherAccepted,
        });
        return;
      }

      const ringing = current.ringing.includes(uid)
        ? current.ringing
        : [...current.ringing, uid];
      const accepted = current.accepted.filter((id) => String(id) !== uid);
      this.callsByChannel.set(String(channelId), {
        ...current,
        status: ringing.length > 0 ? "ringing" : current.status,
        ringing,
        accepted,
      });
    });
  }

  clearIfLastLocal(channelId: Snowflake, selfId?: Snowflake | null) {
    const call = this.getCall(channelId);
    if (!call) return;

    const remaining = this.app.voiceStates
      .getAllByChannel(channelId)
      .filter(
        (state) => !selfId || String(state.userId) !== String(selfId),
      );

    if (remaining.length > 0) return;

    for (const state of this.app.voiceStates.getAllByChannel(channelId)) {
      this.app.voiceStates.remove(state.userId);
    }

    this.markPendingCancel(channelId);
    runInAction(() => {
      this.callsByChannel.delete(String(channelId));
    });
  }

  clear() {
    this.dismissedChannels.clear();
    this.pendingCancelChannels.clear();
    this.callsByChannel.clear();
  }
}
