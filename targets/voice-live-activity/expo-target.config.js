/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: "widget",
  name: "VoiceLiveActivityWidget",
  displayName: "Mutualzz",
  bundleIdentifier: ".ExpoWidgetsTarget",
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit", "ActivityKit", "AppIntents"],
  entitlements: {
    "com.apple.security.application-groups": ["group.com.mutualzz.app"],
  },
});
