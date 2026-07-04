const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withAnimatedWebp(config) {
  return withGradleProperties(config, (config) => {
    const key = "expo.webp.animated";
    const existing = config.modResults.find(
      (item) => item.type === "property" && item.key === key,
    );

    if (existing && existing.type === "property") {
      existing.value = "true";
    } else {
      config.modResults.push({ type: "property", key, value: "true" });
    }

    return config;
  });
};
