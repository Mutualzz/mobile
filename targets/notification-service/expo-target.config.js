/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: "notification-service",
  bundleIdentifier: ".notification-service",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.mutualzz.app"],
  },
});
