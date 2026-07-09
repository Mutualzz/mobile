import { registerGlobals } from "react-native-webrtc";

registerGlobals();

declare const global: typeof globalThis & {
  navigator?: Navigator & { product?: string };
};

// Android emulators expose a Chrome user-agent, which makes mediasoup-client
// pick a browser handler unless we mark the runtime as React Native.
if (typeof global.navigator === "object") {
  global.navigator.product = "ReactNative";
}
