const { withProjectBuildGradle } = require("@expo/config-plugins");

const MARKER = "mutualzz-androidx-work-force";
const WORK_VERSION = "2.8.1";

const BLOCK = `
// ${MARKER}
subprojects { subproject ->
    subproject.configurations.all {
        resolutionStrategy {
            force "androidx.work:work-runtime:${WORK_VERSION}"
            force "androidx.work:work-runtime-ktx:${WORK_VERSION}"
        }
    }
}
`;

module.exports = function withAndroidXWorkForce(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }

    config.modResults.contents = `${config.modResults.contents.trimEnd()}\n${BLOCK}\n`;
    return config;
  });
};
