const {
  withInfoPlist,
  createRunOncePlugin,
} = require("@expo/config-plugins");

function withFrequentLiveActivityUpdates(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    config.modResults.NSSupportsLiveActivitiesFrequentUpdates = true;
    return config;
  });
}

module.exports = createRunOncePlugin(
  withFrequentLiveActivityUpdates,
  "withFrequentLiveActivityUpdates",
  "1.0.0",
);
