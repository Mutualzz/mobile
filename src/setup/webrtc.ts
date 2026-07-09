import { registerGlobals } from "react-native-webrtc";

registerGlobals();

declare const global: typeof globalThis & {
  navigator?: Navigator & { product?: string };
};

if (typeof global.navigator === "object") {
  global.navigator.product = "ReactNative";
}
