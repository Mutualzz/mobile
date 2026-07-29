import {
  baseDarkTheme,
  baseLightTheme,
  extractPrimaryFontFamily,
  type ThemeStyle,
  type ThemeType,
} from "@mutualzz/ui-core";
import type { APITheme } from "@mutualzz/types";
import type { Theme as MzTheme } from "@emotion/react";
import { type IObservableArray, makeAutoObservable, observable } from "mobx";
import { Theme } from "@stores/objects/Theme";
import { applyAdaptiveThemeValues } from "@utils/adaptation";
import { ensureAppFont } from "@utils/fonts/appFontLoader";
import { Appearance } from "react-native";

type ApiErrors = Record<string, string>;

export type ThemeCreatorCategory = "general" | "colors";
export type ThemeCreatorPage = "details" | "colors" | "manage";

export type ThemeCreatorLoadedType = "default" | "draft" | "custom";

export type ThemeCreatorFilter = ThemeType | ThemeStyle | "adaptive";

export interface PendingBackgroundFile {
  uri: string;
  name: string;
  type: string;
}

export class ThemeCreatorStore {
  currentCategory: ThemeCreatorCategory = "general";
  currentPage: ThemeCreatorPage = "details";
  values: APITheme;
  inPreview = false;
  themeBeforePreview: APITheme | null = null;
  filters: IObservableArray<ThemeCreatorFilter> = observable.array([]);
  loadedType: ThemeCreatorLoadedType = "default";
  errors: ApiErrors = {};
  userInteracted = false;
  spaceId: string | null = null;
  pendingBackgroundFile: PendingBackgroundFile | null = null;
  pendingBackgroundPreviewUrl: string | null = null;
  clearBackgroundImage = false;
  previewChangeTheme: ((theme: MzTheme) => void) | null = null;
  private readonly prefersDark: boolean;

  constructor() {
    this.prefersDark = Appearance.getColorScheme() === "dark";

    const base = this.prefersDark ? baseDarkTheme : baseLightTheme;

    this.values = Theme.serialize({
      ...base,
      id: "",
      name: "",
      description: "",
    });

    makeAutoObservable(
      this,
      {
        previewChangeTheme: false,
      },
      {
        autoBind: true,
      },
    );
  }

  get nameEmpty() {
    return this.values.name.trim() === "";
  }

  get previewBackgroundImageUrl() {
    if (this.clearBackgroundImage) return null;
    if (this.pendingBackgroundPreviewUrl)
      return this.pendingBackgroundPreviewUrl;
    if (this.values.id) {
      return Theme.resolveBackgroundImageUrl(
        this.values.id,
        this.values.backgroundImage,
      );
    }
    return null;
  }

  buildPreviewEmotion() {
    let previewThemeValues = this.values;

    if (this.values.adaptive) {
      previewThemeValues = Theme.serialize(
        applyAdaptiveThemeValues(this.values),
      );
    }

    const emotion = Theme.toEmotion(previewThemeValues);
    const backgroundImageUrl = this.clearBackgroundImage
      ? null
      : (this.pendingBackgroundPreviewUrl ?? emotion.backgroundImageUrl);

    return {
      ...emotion,
      backgroundImage: this.clearBackgroundImage
        ? null
        : emotion.backgroundImage,
      backgroundImageUrl,
    };
  }

  applyPreview() {
    if (!this.inPreview || !this.previewChangeTheme) return;
    this.previewChangeTheme(this.buildPreviewEmotion());
  }

  setCurrentCategory(category: ThemeCreatorCategory) {
    this.currentCategory = category;
  }

  setCurrentPage(page: ThemeCreatorPage) {
    this.currentPage = page;
  }

  setErrors(errors: ApiErrors) {
    this.errors = errors;
  }

  setValues(newValues: Partial<APITheme>) {
    this.values = Theme.serialize({ ...this.values, ...newValues });

    if (!this.userInteracted) this.userInteracted = true;
    if (this.loadedType === "default") this.loadedType = "custom";
    this.errors = {};
    this.applyPreview();
  }

  resetToBaseTheme() {
    const base = this.prefersDark ? baseDarkTheme : baseLightTheme;

    this.values = Theme.serialize({
      ...base,
      id: "",
      name: "",
      description: "",
    });

    this.loadedType = "default";
    this.userInteracted = false;
    this.errors = {};
    this.currentPage = "details";
    this.currentCategory = "general";
    this.clearPendingBackground();
  }

  loadValues(theme: APITheme) {
    this.clearPendingBackground();
    if (this.loadedType === "default") {
      this.values = Theme.serialize({
        ...this.values,
        ...theme,
        id: "",
        name: "",
        description: "",
      });
      if (this.userInteracted) this.userInteracted = false;
      return;
    }

    this.values = Theme.serialize(theme);
    if (!this.userInteracted) this.userInteracted = true;
  }

  resetValues() {
    this.resetToBaseTheme();
    this.themeBeforePreview = null;
    this.inPreview = false;
    this.previewChangeTheme = null;
  }

  addFilter(filter: ThemeCreatorFilter) {
    if (!this.filters.includes(filter)) this.filters.push(filter);
  }

  removeFilter(filter: ThemeCreatorFilter) {
    if (!this.filters.includes(filter)) return;
    this.filters.remove(filter);
  }

  setFilters(filters: ThemeCreatorFilter[]) {
    this.filters.replace(filters);
  }

  resetFilters() {
    this.filters.clear();
  }

  filter(themes: Theme[]) {
    if (this.filters.length === 0) return themes;

    return themes.filter((theme) =>
      this.filters.some(
        (filter) =>
          theme.type === filter ||
          theme.style === filter ||
          (filter === "adaptive" && theme.adaptive),
      ),
    );
  }

  setLoadedType(type: ThemeCreatorLoadedType) {
    this.loadedType = type;
  }

  setSpaceId(spaceId: string | null) {
    this.spaceId = spaceId;
  }

  setPendingBackgroundFile(file: PendingBackgroundFile | null) {
    this.pendingBackgroundFile = file;
    this.pendingBackgroundPreviewUrl = file?.uri ?? null;
    this.clearBackgroundImage = false;
    if (!this.userInteracted) this.userInteracted = true;
    this.applyPreview();
  }

  markClearBackgroundImage() {
    this.pendingBackgroundFile = null;
    this.pendingBackgroundPreviewUrl = null;
    this.clearBackgroundImage = true;
    if (!this.userInteracted) this.userInteracted = true;
    this.applyPreview();
  }

  clearPendingBackground() {
    this.pendingBackgroundFile = null;
    this.pendingBackgroundPreviewUrl = null;
    this.clearBackgroundImage = false;
  }

  startPreview(
    changeTheme: (theme: MzTheme) => void,
    currentThemeValues?: APITheme,
    ownerUserId?: string | null,
  ) {
    if (this.inPreview) return;

    if (!this.themeBeforePreview && currentThemeValues) {
      this.themeBeforePreview = Theme.serialize(currentThemeValues);
    }

    this.previewChangeTheme = this.spaceId ? null : changeTheme;
    this.inPreview = true;

    const fontFamily =
      extractPrimaryFontFamily(this.values.typography.fontFamily) ??
      this.values.typography.fontFamily;

    void ensureAppFont(
      fontFamily,
      ownerUserId ?? this.values.authorId,
    )
      .catch(() => { return; })
      .finally(() => {
        this.applyPreview();
      });
  }

  stopPreview(changeTheme: (theme: MzTheme) => void) {
    if (!this.inPreview) return;

    if (this.themeBeforePreview && !this.spaceId) {
      changeTheme(Theme.toEmotion(this.themeBeforePreview));
    }

    this.themeBeforePreview = null;
    this.inPreview = false;
    this.previewChangeTheme = null;
  }
}
