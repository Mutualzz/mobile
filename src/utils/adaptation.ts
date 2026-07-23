import type { APITheme } from "@mutualzz/types";
import {
  adaptColors as adaptColorsBase,
  applyAdaptiveThemeValues as applyAdaptiveThemeValuesBase,
} from "@mutualzz/client";
import { Appearance } from "react-native";

type AdaptInput = Omit<Parameters<typeof adaptColorsBase>[0], "prefersDark">;

export const adaptColors = (input: AdaptInput) =>
  adaptColorsBase({
    ...input,
    prefersDark: Appearance.getColorScheme() === "dark",
  });

export const applyAdaptiveThemeValues = (values: APITheme) =>
  applyAdaptiveThemeValuesBase(
    values,
    Appearance.getColorScheme() === "dark",
  );
