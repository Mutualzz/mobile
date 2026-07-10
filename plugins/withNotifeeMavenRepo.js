const { withProjectBuildGradle } = require("@expo/config-plugins");

const NOTIFEE_MAVEN_MARKER = "app.notifee";

const NOTIFEE_MAVEN_REPO = `
    exclusiveContent {
      forRepository {
        maven {
          url(new File(["node", "--print", "require.resolve('@notifee/react-native/package.json')"].execute(null, rootDir).text.trim(), "../android/libs"))
        }
      }
      filter {
        includeGroup "app.notifee"
      }
    }`;

module.exports = function withNotifeeMavenRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(NOTIFEE_MAVEN_MARKER)) {
      return config;
    }

    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      `allprojects {
  repositories {${NOTIFEE_MAVEN_REPO}`,
    );

    return config;
  });
};
