import { readAudioLevelFromStats } from "./webrtcBridge";

const SPEAKING_ON_DELAY_MS = 50;
const SPEAKING_OFF_DELAY_MS = 250;
const SPEAKING_TICK_MS = 100;

type StatsSource = () => Promise<RTCStatsReport>;

interface DetectorState {
  speaking: boolean;
  lastAbove: number;
  lastBelow: number;
  sources: Set<StatsSource>;
}

export class SpeakingDetector {
  private readonly states = new Map<string, DetectorState>();
  private tickTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onSpeakingChange: (
      userId: string,
      speaking: boolean,
    ) => void,
    private readonly getThreshold: () => number,
    private readonly shouldReport: (userId: string) => boolean,
  ) {}

  register(userId: string, source: StatsSource) {
    let state = this.states.get(userId);
    if (!state) {
      state = {
        speaking: false,
        lastAbove: 0,
        lastBelow: 0,
        sources: new Set(),
      };
      this.states.set(userId, state);
    }

    state.sources.add(source);
    this.ensureTick();
  }

  unregister(userId: string, source?: StatsSource) {
    const state = this.states.get(userId);
    if (!state) return;

    if (source) {
      state.sources.delete(source);
      if (state.sources.size > 0) return;
    }

    if (state.speaking) {
      this.onSpeakingChange(userId, false);
    }
    this.states.delete(userId);

    if (this.states.size === 0) {
      this.stopTick();
    }
  }

  stopAll() {
    for (const userId of Array.from(this.states.keys())) {
      this.unregister(userId);
    }
    this.stopTick();
  }

  isSpeaking(userId: string) {
    return this.states.get(userId)?.speaking ?? false;
  }

  private ensureTick() {
    if (this.tickTimer != null) return;

    const tick = () => {
      if (this.states.size === 0) {
        this.tickTimer = null;
        return;
      }

      void this.sample().finally(() => {
        this.tickTimer = setTimeout(tick, SPEAKING_TICK_MS);
      });
    };

    tick();
  }

  private async sample() {
    const now = Date.now();
    const threshold = this.getThreshold();

    for (const [userId, state] of this.states) {
      if (!this.shouldReport(userId)) {
        if (state.speaking) {
          state.speaking = false;
          this.onSpeakingChange(userId, false);
        }
        continue;
      }

      let peak: number | null = null;
      for (const source of state.sources) {
        try {
          const stats = await source();
          const level = readAudioLevelFromStats(stats);
          if (level != null) {
            peak = peak == null ? level : Math.max(peak, level);
          }
        } catch {}
      }

      const above = peak != null && peak > threshold;

      if (above) {
        state.lastAbove = now;
        if (!state.speaking && now - state.lastBelow > SPEAKING_ON_DELAY_MS) {
          state.speaking = true;
          this.onSpeakingChange(userId, true);
        }
      } else {
        state.lastBelow = now;
        if (state.speaking && now - state.lastAbove > SPEAKING_OFF_DELAY_MS) {
          state.speaking = false;
          this.onSpeakingChange(userId, false);
        }
      }
    }
  }

  private stopTick() {
    if (this.tickTimer != null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
  }
}
