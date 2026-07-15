const {
  AndroidConfig,
  withAndroidManifest,
} = require("@expo/config-plugins");

const NOTIFEE_FGS = "app.notifee.core.ForegroundService";

module.exports = function withNotifeeMicrophoneFgs(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const application =
      AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    if (!application.service) {
      application.service = [];
    }

    const existing = application.service.find(
      (service) => service.$?.["android:name"] === NOTIFEE_FGS,
    );

    const attrs = {
      "android:name": NOTIFEE_FGS,
      "android:foregroundServiceType": "microphone",
      "tools:replace": "android:foregroundServiceType",
    };

    if (existing) {
      existing.$ = {
        ...existing.$,
        ...attrs,
      };
    } else {
      application.service.push({ $: attrs });
    }

    return config;
  });
};
