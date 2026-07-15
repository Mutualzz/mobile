export const SPLASH_BACKGROUND_LIGHT = "#FBF7FB";
export const SPLASH_BACKGROUND_DARK = "#0D0710";

export function splashBackgroundForScheme(
  scheme: string | null | undefined,
): string {
  return scheme === "dark" ? SPLASH_BACKGROUND_DARK : SPLASH_BACKGROUND_LIGHT;
}
