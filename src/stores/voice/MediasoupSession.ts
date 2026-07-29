import { Logger } from "@mutualzz/logger";
import {
  VoiceDispatchEvents,
  VoiceOpcodes,
  type VoiceOpcode,
} from "@mutualzz/types";
import * as mediasoupClient from "mediasoup-client";
import {
  MediaStream,
  type MediaStreamTrack,
  mediaDevices,
} from "react-native-webrtc";
import { Dimensions } from "react-native";

import type { VoiceInputMode } from "@utils/voiceSettings.utils";
import { openWebSocket } from "@utils/openWebSocket";
import type { VoiceMediaKind } from "./types";
import { setConsumerAudioMix } from "./audioTrackVolume";
import { SpeakingDetector } from "./SpeakingDetector";
import {
  createVoiceRpcId,
  parseConsumerOptionsResponse,
  parseNewProducerEvent,
  parseProducerClosedEvent,
  parseProducerIdResponse,
  parseRtpCapabilitiesResponse,
  parseTransportOptionsResponse,
  toNativeMediaStreamTrack,
  toProduceTrack,
} from "./webrtcBridge";

const TRANSPORT_CONNECT_TIMEOUT_MS = 15_000;

function getCaptureVideoOrientation(): 0 | 90 {
  const { width, height } = Dimensions.get("window");
  return height >= width ? 90 : 0;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Voice disconnected"));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Voice disconnected"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    promise
      .then((value) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      });
  });
}

interface UserMix {
  muted: boolean;
  volume: number;
}

interface PendingRpc {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface PendingProducer {
  userId: string;
  mediaKind: VoiceMediaKind;
}

export interface MediasoupSessionCallbacks {
  onSocketClosed: (reason?: string) => void;
  onRemoteCameraStream: (
    userId: string,
    producerId: string,
    stream: MediaStream | null,
  ) => void;
  onMicFailed: () => void;
  onSpeakingChange: (userId: string, speaking: boolean) => void;
  onAudioConsumerReady: (userId: string) => void;
}

export interface MediasoupSessionOptions {
  callbacks: MediasoupSessionCallbacks;
  getSelfUserId: () => string | undefined;
  getSpeakingThreshold: () => number;
  shouldReportSpeaking: (userId: string) => boolean;
  getNoiseSuppression: () => boolean;
  getUserAudioMix?: (userId: string) => UserMix;
}

export class MediasoupSession {
  private socket: WebSocket | null = null;
  private device: mediasoupClient.types.Device | null = null;
  private loadedRouterRtpCapabilitiesKey: string | null = null;
  private sendTransport: mediasoupClient.types.Transport | null = null;
  private receiverTransport: mediasoupClient.types.Transport | null = null;

  private micTrack: MediaStreamTrack | null = null;
  private cameraTrack: MediaStreamTrack | null = null;
  private localCameraStream: MediaStream | null = null;
  private micProducer: mediasoupClient.types.Producer | null = null;
  private cameraProducer: mediasoupClient.types.Producer | null = null;

  private consumersByProducerId = new Map<
    string,
    mediasoupClient.types.Consumer
  >();
  private producerUserMap = new Map<string, string>();
  private producerKindMap = new Map<string, VoiceMediaKind>();
  private remoteStreams = new Map<string, MediaStream>();

  private pendingRequests = new Map<string, PendingRpc>();
  private pendingProducerIds = new Map<string, PendingProducer>();
  private setupComplete = false;
  private consumeAbortSignal: AbortSignal | null = null;
  private produceChain: Promise<unknown> = Promise.resolve();

  private isMuted = false;
  private isDeafened = false;
  private spaceMuted = false;
  private inputMode: VoiceInputMode = "voice_activity";
  private pushToTalkPressed = false;
  private currentInputDeviceId: string | null = null;
  private currentCameraDeviceId: string | null = null;

  private readonly callbacks: MediasoupSessionCallbacks;
  private readonly getSelfUserId: () => string | undefined;
  private readonly getNoiseSuppression: () => boolean;
  private readonly getUserAudioMix?: (userId: string) => UserMix;
  private readonly speakingDetector: SpeakingDetector;
  private readonly statsSources = new Map<
    string,
    () => Promise<RTCStatsReport>
  >();

  private readonly logger = new Logger({ tag: "VoiceSession" });

  constructor(options: MediasoupSessionOptions) {
    this.callbacks = options.callbacks;
    this.getSelfUserId = options.getSelfUserId;
    this.getNoiseSuppression = options.getNoiseSuppression;
    this.getUserAudioMix = options.getUserAudioMix;
    this.speakingDetector = new SpeakingDetector(
      (userId, speaking) => {
        this.callbacks.onSpeakingChange(userId, speaking);
      },
      options.getSpeakingThreshold,
      options.shouldReportSpeaking,
    );
  }

  private withProduceLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.produceChain.then(fn, fn);
    this.produceChain = run.then(
      () => null,
      () => null,
    );
    return run;
  }

  getLocalCameraStream() {
    if (!this.cameraTrack) {
      this.localCameraStream = null;
      return null;
    }
    const existing = this.localCameraStream?.getVideoTracks()[0];
    if (!this.localCameraStream || existing !== this.cameraTrack) {
      this.localCameraStream = new MediaStream([this.cameraTrack]);
    }
    return this.localCameraStream;
  }

  setInputDeviceId(id: string | null) {
    this.currentInputDeviceId = id;
  }

  setCameraDeviceId(id: string | null) {
    this.currentCameraDeviceId = id;
  }

  setInputMode(mode: VoiceInputMode) {
    this.inputMode = mode;
    if (mode === "voice_activity") {
      this.pushToTalkPressed = false;
    }
    this.applyMicState();
  }

  setPushToTalkPressed(pressed: boolean) {
    if (this.inputMode !== "push_to_talk") return;
    if (this.pushToTalkPressed === pressed) return;
    this.pushToTalkPressed = pressed;
    this.applyMicState();
  }

  setSpaceMute(muted: boolean) {
    this.spaceMuted = muted;
    this.applyMicState();
  }

  setSelfMute(muted: boolean) {
    this.isMuted = muted;
    this.applyMicState();
  }

  setSelfDeaf(deafened: boolean) {
    this.isDeafened = deafened;
    this.applyRemoteAudioState();
    this.applyMicState();
  }

  private applyMicState() {
    const inputOpen =
      this.inputMode === "voice_activity" ? true : this.pushToTalkPressed;

    const shouldTransmit =
      !this.isMuted && !this.spaceMuted && !this.isDeafened && inputOpen;

    if (this.micProducer) {
      try {
        if (shouldTransmit) this.micProducer.resume();
        else this.micProducer.pause();
      } catch {
    // ignore
}
    }
  }

  applyAudioForUser(userId: string, mix: UserMix) {
    for (const [producerId, uid] of this.producerUserMap) {
      if (uid !== userId) continue;
      if (this.producerKindMap.get(producerId) !== "audio") continue;

      const consumer = this.consumersByProducerId.get(producerId);
      if (!consumer) continue;

      try {
        setConsumerAudioMix(consumer, mix.volume, mix.muted || this.isDeafened);
      } catch (error) {
        this.logger.warn("Failed to apply audio mix", error);
      }
    }
  }

  private applyRemoteAudioState() {
    for (const [producerId, consumer] of this.consumersByProducerId) {
      if (this.producerKindMap.get(producerId) !== "audio") continue;
      const userId = this.producerUserMap.get(producerId);
      if (!userId) continue;
      try {
        const mix = this.getUserAudioMix?.(userId) ?? {
          muted: false,
          volume: 100,
        };
        setConsumerAudioMix(consumer, mix.volume, mix.muted || this.isDeafened);
      } catch (error) {
        this.logger.warn("Failed to apply remote audio state", error);
      }
    }
  }

  private registerAudioSpeaking(
    userId: string,
    producerId: string,
    consumer: mediasoupClient.types.Consumer,
  ) {
    const source = () => consumer.getStats();
    this.statsSources.set(producerId, source);
    this.speakingDetector.register(userId, source);
  }

  private unregisterAudioSpeaking(userId: string, producerId: string) {
    const source = this.statsSources.get(producerId);
    if (source) {
      this.speakingDetector.unregister(userId, source);
      this.statsSources.delete(producerId);
    }
  }

  async connect(endpoint: string, token: string, signal: AbortSignal) {
    this.setupComplete = false;
    this.consumeAbortSignal = signal;

    const url = new URL(endpoint);
    url.searchParams.set("token", token);

    const socket = await this.openSocket(url.toString(), signal);
    if (signal.aborted) {
      socket.close(1000, "superseded");
      return;
    }

    this.socket = socket;

    const authData = await this.rpc(VoiceOpcodes.VoiceAuthenticate, { token });
    if (signal.aborted) return;

    let rtpCapabilities: mediasoupClient.types.RtpCapabilities | null;
    try {
      rtpCapabilities = parseRtpCapabilitiesResponse(authData);
    } catch {
      rtpCapabilities = null;
    }
    if (!rtpCapabilities) {
      rtpCapabilities = parseRtpCapabilitiesResponse(
        await this.rpc(VoiceOpcodes.VoiceGetRTPCapabilities, {}),
      );
    }

    if (signal.aborted) return;

    const device = await this.ensureDevice(rtpCapabilities, signal);
    if (!device || signal.aborted) return;

    const [recvRaw, sendRaw] = await Promise.all([
      this.rpc(VoiceOpcodes.VoiceCreateTransport, { direction: "receive" }),
      this.rpc(VoiceOpcodes.VoiceCreateTransport, { direction: "send" }),
    ]);
    if (signal.aborted) return;

    const recvOptions = parseTransportOptionsResponse(recvRaw);
    const sendOptions = parseTransportOptionsResponse(sendRaw);

    const recvTransport = device.createRecvTransport(recvOptions);
    recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
      void this.rpc(VoiceOpcodes.VoiceConnectTransport, {
        transportId: recvTransport.id,
        dtlsParameters,
      })
        .then(() => callback())
        .catch(errback);
    });
    this.receiverTransport = recvTransport;

    const sendTransport = device.createSendTransport(sendOptions);
    sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
      void this.rpc(VoiceOpcodes.VoiceConnectTransport, {
        transportId: sendTransport.id,
        dtlsParameters,
      })
        .then(() => callback())
        .catch(errback);
    });
    sendTransport.on(
      "produce",
      ({ kind, rtpParameters, appData }, callback, errback) => {
        void this.rpcWithRetry(
          VoiceOpcodes.VoiceProduce,
          {
            transportId: sendTransport.id,
            kind,
            rtpParameters,
            appData,
          },
          signal,
        )
          .then((data) => {
            callback({ id: parseProducerIdResponse(data) });
          })
          .catch(errback);
      },
    );
    this.sendTransport = sendTransport;

    this.setupComplete = true;
    void this.rpc(VoiceOpcodes.VoiceSetRTPCapabilities, {
      rtpCapabilities: device.recvRtpCapabilities,
    }).catch((error) => {
      this.logger.warn("VoiceSetRTPCapabilities failed", error);
    });
    void this.flushPendingProducers(signal).catch((error) => {
      this.logger.warn("flushPendingProducers failed", error);
    });
  }

  private rtpCapabilitiesKey(rtpCapabilities: unknown): string {
    try {
      return JSON.stringify(rtpCapabilities);
    } catch {
      return "";
    }
  }

  private async ensureDevice(
    rtpCapabilities: mediasoupClient.types.RtpCapabilities,
    signal: AbortSignal,
  ): Promise<mediasoupClient.types.Device | null> {
    const key = this.rtpCapabilitiesKey(rtpCapabilities);
    if (
      this.device?.loaded &&
      this.loadedRouterRtpCapabilitiesKey &&
      this.loadedRouterRtpCapabilitiesKey === key
    ) {
      return this.device;
    }

    const device = await mediasoupClient.Device.factory({
      handlerName: "ReactNative106",
    });
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    if (signal.aborted) return null;
    this.device = device;
    this.loadedRouterRtpCapabilitiesKey = key;
    return device;
  }

  async startMic(signal: AbortSignal) {
    if (!this.sendTransport) return;

    const stream = await this.acquireMicMedia(signal);
    if (!stream) {
      this.logger.warn("Mic capture failed");
      this.setSelfMute(true);
      this.callbacks.onMicFailed();
      return;
    }

    if (signal.aborted) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const [audioTrack] = stream.getAudioTracks();
    if (!audioTrack) {
      this.setSelfMute(true);
      this.callbacks.onMicFailed();
      return;
    }

    this.micTrack = audioTrack;
    try {
      this.micProducer = await this.withProduceLock(() =>
        withTimeout(
          this.sendTransport!.produce({
            track: toProduceTrack(audioTrack, "audio"),
            appData: { mediaKind: "audio" },
            codecOptions: { opusStereo: true, opusDtx: true },
          }),
          TRANSPORT_CONNECT_TIMEOUT_MS,
          "Voice transport connection timed out",
          signal,
        ),
      );
    } catch (error) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
    // ignore
}
      });
      this.micTrack = null;
      throw error;
    }

    const selfId = this.getSelfUserId();
    if (selfId && this.micProducer) {
      const source = () => this.micProducer!.getStats();
      this.statsSources.set(this.micProducer.id, source);
      this.speakingDetector.register(selfId, source);
    }

    this.applyMicState();
  }

  async startCamera(signal: AbortSignal) {
    if (!this.sendTransport) return;

    const stream = await mediaDevices.getUserMedia({
      audio: false,
      video: this.currentCameraDeviceId
        ? {
            deviceId: this.currentCameraDeviceId,
            width: { ideal: 720 },
            height: { ideal: 1280 },
            frameRate: { ideal: 30 },
          }
        : {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 1280 },
            frameRate: { ideal: 30 },
          },
    });

    if (signal.aborted) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const [videoTrack] = stream.getVideoTracks();
    if (!videoTrack) return;

    this.cameraTrack = videoTrack;
    try {
      this.cameraProducer = await this.withProduceLock(() =>
        withTimeout(
          this.sendTransport!.produce({
            track: toProduceTrack(videoTrack, "video"),
            appData: {
              mediaKind: "camera",
              videoOrientation: getCaptureVideoOrientation(),
            },
            codecOptions: {
              videoGoogleStartBitrate: 1000,
              videoGoogleMaxBitrate: 9000,
            },
          }),
          TRANSPORT_CONNECT_TIMEOUT_MS,
          "Voice transport connection timed out",
          signal,
        ),
      );
    } catch (error) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
    // ignore
}
      });
      this.cameraTrack = null;
      throw error;
    }
  }

  async stopCamera() {
    const producerId = this.cameraProducer?.id ?? null;

    try {
      this.cameraProducer?.close();
    } catch {
    // ignore
}
    this.cameraProducer = null;

    if (this.cameraTrack) {
      try {
        this.cameraTrack.stop();
      } catch {
    // ignore
}
      this.cameraTrack = null;
      this.localCameraStream = null;
    }

    if (producerId) {
      try {
        await this.rpc(VoiceOpcodes.VoiceCloseProducer, { producerId });
      } catch {
    // ignore
}
    }
  }

  async restartMic(signal: AbortSignal) {
    await this.produceChain.then(
      () => null,
      () => null,
    );
    if (signal.aborted) return;

    const selfId = this.getSelfUserId();
    const producerId = this.micProducer?.id ?? null;
    if (selfId && this.micProducer) {
      const source = this.statsSources.get(this.micProducer.id);
      if (source) {
        this.speakingDetector.unregister(selfId, source);
        this.statsSources.delete(this.micProducer.id);
      }
    }

    try {
      this.micProducer?.close();
    } catch {
    // ignore
}
    this.micProducer = null;

    if (producerId && this.socket) {
      try {
        await this.rpc(VoiceOpcodes.VoiceCloseProducer, { producerId });
      } catch {
    // ignore
}
    }

    if (this.micTrack) {
      try {
        this.micTrack.stop();
      } catch {
    // ignore
}
      this.micTrack = null;
    }

    if (!this.sendTransport) return;
    await this.startMic(signal);
  }

  async restartCamera(signal: AbortSignal) {
    await this.stopCamera();
    if (!this.sendTransport || signal.aborted) return;
    await this.startCamera(signal);
  }

  teardown() {
    this.setupComplete = false;
    this.consumeAbortSignal = null;
    this.pendingProducerIds.clear();
    this.isMuted = false;
    this.isDeafened = false;
    this.spaceMuted = false;
    this.inputMode = "voice_activity";
    this.pushToTalkPressed = false;
    this.speakingDetector.stopAll();
    this.statsSources.clear();

    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Voice disconnected"));
    }
    this.pendingRequests.clear();

    try {
      this.sendTransport?.close();
    } catch {
    // ignore
}
    try {
      this.receiverTransport?.close();
    } catch {
    // ignore
}
    this.sendTransport = null;
    this.receiverTransport = null;
    this.produceChain = Promise.resolve();

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onmessage = null;
      try {
        this.socket.close(1000, "teardown");
      } catch {
    // ignore
}
      this.socket = null;
    }

    try {
      this.micProducer?.close();
    } catch {
    // ignore
}
    this.micProducer = null;
    if (this.micTrack) {
      try {
        this.micTrack.stop();
      } catch {
    // ignore
}
      this.micTrack = null;
    }

    try {
      this.cameraProducer?.close();
    } catch {
    // ignore
}
    this.cameraProducer = null;
    if (this.cameraTrack) {
      try {
        this.cameraTrack.stop();
      } catch {
    // ignore
}
      this.cameraTrack = null;
      this.localCameraStream = null;
    }

    for (const [, consumer] of this.consumersByProducerId) {
      try {
        consumer.close();
      } catch {
    // ignore
}
    }
    this.consumersByProducerId.clear();

    for (const [, stream] of this.remoteStreams) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
    // ignore
}
      });
    }
    this.remoteStreams.clear();
    this.producerUserMap.clear();
    this.producerKindMap.clear();
  }

  private async acquireMicMedia(signal: AbortSignal) {
    const noiseSuppression = this.getNoiseSuppression();
    const attempts: Record<string, unknown>[] = [];
    const audioBase = {
      echoCancellation: true,
      noiseSuppression,
      autoGainControl: true,
    };
    if (this.currentInputDeviceId) {
      attempts.push({
        ...audioBase,
        deviceId: this.currentInputDeviceId,
      });
    }
    attempts.push(audioBase);

    for (const audio of attempts) {
      if (signal.aborted) throw new Error("Voice disconnected");
      try {
        return await mediaDevices.getUserMedia({
          audio,
          video: false,
        });
      } catch (error) {
        if (signal.aborted) throw error;
      }
    }

    return null;
  }

  private async consumeProducer(
    producerId: string,
    userId: string,
    signal: AbortSignal,
    mediaKind: VoiceMediaKind,
  ) {
    if (!this.device || !this.receiverTransport) return;
    if (this.consumersByProducerId.has(producerId)) return;
    if (signal.aborted) return;

    const response = parseConsumerOptionsResponse(
      await this.rpcWithRetry(
        VoiceOpcodes.VoiceConsume,
        { producerId },
        signal,
      ),
    );

    if (signal.aborted) return;

    const opts = response.consumerOptions;
    const consumer = await this.receiverTransport.consume({
      id: opts.id,
      producerId: opts.producerId,
      kind: opts.kind,
      rtpParameters: opts.rtpParameters,
    });

    if (signal.aborted) {
      try {
        consumer.close();
      } catch {
    // ignore
}
      return;
    }

    try {
      this.consumersByProducerId.set(producerId, consumer);
      this.producerUserMap.set(producerId, userId);

      const kind: VoiceMediaKind =
        mediaKind === "screen" || mediaKind === "screen-audio"
          ? mediaKind
          : consumer.kind === "video"
            ? "camera"
            : mediaKind === "camera"
              ? "camera"
              : "audio";

      this.producerKindMap.set(producerId, kind);

      const stream = new MediaStream([toNativeMediaStreamTrack(consumer.track)]);
      this.remoteStreams.set(producerId, stream);

      await this.rpc(VoiceOpcodes.VoiceResumeConsumer, {
        consumerId: consumer.id,
      });

      if (kind === "camera") {
        this.callbacks.onRemoteCameraStream(userId, producerId, stream);
      } else if (kind === "audio") {
        if (this.isDeafened) {
          setConsumerAudioMix(consumer, 100, true);
        }
        this.registerAudioSpeaking(userId, producerId, consumer);
        this.callbacks.onAudioConsumerReady(userId);
      } else if (kind === "screen-audio") {
        if (this.isDeafened) {
          setConsumerAudioMix(consumer, 100, true);
        }
      }
    } catch (error) {
      this.cleanupProducer(producerId);
      throw error;
    }
  }

  private async flushPendingProducers(signal: AbortSignal) {
    const queued = Array.from(this.pendingProducerIds.entries());

    await Promise.all(
      queued.map(async ([producerId, { userId, mediaKind }]) => {
        if (signal.aborted) return;
        try {
          await this.consumeProducer(producerId, userId, signal, mediaKind);
          this.pendingProducerIds.delete(producerId);
        } catch (error) {
          this.logger.warn("Pending producer consume failed", error);
        }
      }),
    );
  }

  private cleanupProducersForUser(userId: string) {
    const producerIds = Array.from(this.producerUserMap.entries())
      .filter(([, uid]) => uid === userId)
      .map(([producerId]) => producerId);

    for (const producerId of producerIds) {
      this.cleanupProducer(producerId);
    }

    for (const [producerId, pending] of this.pendingProducerIds) {
      if (pending.userId === userId) {
        this.pendingProducerIds.delete(producerId);
      }
    }
  }

  private cleanupProducer(producerId: string) {
    const consumer = this.consumersByProducerId.get(producerId);
    if (consumer) {
      try {
        consumer.close();
      } catch {
    // ignore
}
      this.consumersByProducerId.delete(producerId);
    }

    const stream = this.remoteStreams.get(producerId);
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
    // ignore
}
      });
      this.remoteStreams.delete(producerId);
    }

    const userId = this.producerUserMap.get(producerId);
    const kind = this.producerKindMap.get(producerId);

    if (userId && kind === "audio") {
      this.unregisterAudioSpeaking(userId, producerId);
    }

    this.producerUserMap.delete(producerId);
    this.producerKindMap.delete(producerId);

    if (userId && kind === "camera") {
      this.callbacks.onRemoteCameraStream(userId, producerId, null);
    }
  }

  private openSocket(url: string, signal: AbortSignal): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error("Voice disconnected"));
        return;
      }

      const ws = openWebSocket(url);
      ws.onmessage = (event) => this.onMessage(String(event.data));
      ws.onerror = () => reject(new Error("Voice socket failed to open"));
      ws.onclose = () => reject(new Error("Voice socket closed before open"));

      ws.onopen = () => {
        ws.onclose = (event) => {
          const reason = event.reason || "Voice connection closed";
          try {
            this.callbacks.onSocketClosed(reason);
          } catch {
    // ignore
}
        };
        resolve(ws);
      };

      signal.addEventListener(
        "abort",
        () => {
          ws.onclose = null;
          ws.onerror = null;
          try {
            ws.close(1000, "superseded");
          } catch {
    // ignore
}
          reject(new Error("Voice disconnected"));
        },
        { once: true },
      );
    });
  }

  private onMessage(raw: string) {
    let envelope: {
      id?: string;
      op?: string | number;
      ok?: boolean;
      data?: unknown;
      error?: { message?: string };
    };

    try {
      envelope = JSON.parse(raw);
    } catch {
      return;
    }

    if (envelope.id == null && envelope.op != null) {
      void this.onPush(String(envelope.op), envelope.data).catch((error) => {
        this.logger.debug("onPush failed", error);
      });
      return;
    }

    const pending = this.pendingRequests.get(envelope.id ?? "");
    if (!pending) return;
    this.pendingRequests.delete(envelope.id!);
    clearTimeout(pending.timer);

    if (envelope.ok) pending.resolve(envelope.data ?? {});
    else {
      pending.reject(new Error(envelope.error?.message ?? "Voice RPC error"));
    }
  }

  private async onPush(op: string, data: unknown) {
    if (op === VoiceDispatchEvents.VoiceProducerClosed) {
      const payload = parseProducerClosedEvent(data);
      if (!payload) return;
      this.cleanupProducer(payload.producerId);
      return;
    }

    if (op === VoiceDispatchEvents.VoicePeerLeft) {
      const userId =
        data &&
        typeof data === "object" &&
        "userId" in data &&
        data.userId != null
          ? String(data.userId)
          : null;
      if (!userId) return;
      this.cleanupProducersForUser(userId);
      return;
    }

    if (op === VoiceDispatchEvents.VoicePeerJoined) {
      return;
    }

    if (op === VoiceDispatchEvents.VoiceNewProducer) {
      const payload = parseNewProducerEvent(data);
      if (!payload) return;

      const { producerId, userId, mediaKind } = payload;

      const resolvedKind: VoiceMediaKind =
        mediaKind === "screen"
          ? "screen"
          : mediaKind === "screen-audio"
            ? "screen-audio"
            : mediaKind === "camera"
              ? "camera"
              : "audio";

      if (resolvedKind === "screen" || resolvedKind === "screen-audio") {
        return;
      }

      if (!this.setupComplete) {
        this.pendingProducerIds.set(producerId, {
          userId,
          mediaKind: resolvedKind,
        });
        return;
      }

      const signal = this.consumeAbortSignal;
      if (!signal || signal.aborted) return;

      await this.consumeProducer(producerId, userId, signal, resolvedKind);
    }
  }

  private rpc(op: VoiceOpcode, data?: unknown, timeoutMs = 8_000) {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Voice socket not connected"));
    }

    const id = createVoiceRpcId();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Voice RPC timed out: ${op}`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
        timer,
      });

      try {
        socket.send(JSON.stringify({ id, op, data }));
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  private async rpcWithRetry(
    op: VoiceOpcode,
    data: unknown,
    signal: AbortSignal,
    retries = 4,
  ) {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (signal.aborted) throw new Error("Voice disconnected");
      try {
        return await this.rpc(op, data);
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("Voice state not found")) throw error;
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * (attempt + 1)),
          );
        }
      }
    }

    throw lastError;
  }
}
