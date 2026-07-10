import { scaledLayoutSize, useFontScale } from "@mutualzz/ui-native";
import type { ImageStyle, ViewStyle } from "react-native";

export function useScaledAutocompleteMaxHeight(base = 220) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 2);
}

export function useScaledModalListMaxHeight(base = 320) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.75);
}

export function useScaledComposerPanelMaxHeight(base = 160) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.75);
}

export function useExpressionThumbnailStyle(base = 32): ImageStyle {
    const fontScale = useFontScale();
    const size = scaledLayoutSize(base, fontScale, 1.35);

    return {
        width: size,
        height: size,
        borderRadius: scaledLayoutSize(6, fontScale, 1.2),
        flexShrink: 0,
    };
}

export function useScaledRowPadding(base = 10) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.5);
}

export function useScaledEmojiHeaderHeights() {
    const fontScale = useFontScale();

    return {
        headerHeight: scaledLayoutSize(24, fontScale, 1.5),
        spaceHeaderHeight: scaledLayoutSize(28, fontScale, 1.5),
    };
}

export function useScaledMinTouchSize(base = 44): ViewStyle {
    const fontScale = useFontScale();

    return {
        minHeight: scaledLayoutSize(base, fontScale, 1.5),
        minWidth: scaledLayoutSize(base, fontScale, 1.5),
    };
}

export function useScaledTouchTarget(base = 48) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.5);
}

export function useScaledSquareSize(base: number) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.35);
}

export function useScaledProfileMetrics() {
    const fontScale = useFontScale();

    return {
        avatarSize: scaledLayoutSize(80, fontScale, 1.3),
        minBannerHeight: scaledLayoutSize(96, fontScale, 1.25),
        maxBannerHeight: scaledLayoutSize(200, fontScale, 1.25),
        baseBannerHeight: scaledLayoutSize(140, fontScale, 1.25),
    };
}

export function useScaledReactionChipStyle(): ViewStyle {
    const fontScale = useFontScale();

    return {
        minHeight: scaledLayoutSize(32, fontScale, 1.5),
        paddingHorizontal: scaledLayoutSize(8, fontScale, 1.25),
        paddingVertical: scaledLayoutSize(4, fontScale, 1.25),
    };
}

export function useScaledMentionBadgeStyle() {
    const fontScale = useFontScale();

    return {
        minWidth: scaledLayoutSize(16, fontScale, 1.25),
        height: scaledLayoutSize(16, fontScale, 1.25),
        paddingHorizontal: scaledLayoutSize(4, fontScale, 1.15),
    };
}

export function useScaledFeedPreviewSizes() {
    const fontScale = useFontScale();

    return {
        sticker: scaledLayoutSize(72, fontScale, 1.35),
        asset: scaledLayoutSize(64, fontScale, 1.35),
        commentSticker: scaledLayoutSize(56, fontScale, 1.35),
        composerMinHeight: scaledLayoutSize(80, fontScale, 1.75),
        commentComposerMinHeight: scaledLayoutSize(44, fontScale, 1.5),
        assetMaxWidth: scaledLayoutSize(140, fontScale, 1.75),
        gradientOverlayHeight: scaledLayoutSize(220, fontScale, 1.25),
        pageDot: scaledLayoutSize(8, fontScale, 1.25),
        snapStickerMaxHeight: scaledLayoutSize(72, fontScale, 1.35),
    };
}

export function useScaledAvatarEditorSizes() {
    const fontScale = useFontScale();

    return {
        current: scaledLayoutSize(96, fontScale, 1.3),
        preset: scaledLayoutSize(48, fontScale, 1.3),
    };
}

export function useScaledProfilePreviewHeight(base = 160) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.5);
}

export function useScaledThemeSwatchSize(base = 64) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.25);
}

export function useScaledProfileHeaderWidgetMetrics() {
    const fontScale = useFontScale();

    const avatarSizeM = scaledLayoutSize(44, fontScale, 1.25);
    const avatarSizeL = scaledLayoutSize(52, fontScale, 1.25);

    return {
        avatarSizeM,
        avatarSizeL,
        bannerHeightM: scaledLayoutSize(56, fontScale, 1.2),
        bannerHeightL: scaledLayoutSize(80, fontScale, 1.2),
        padding: scaledLayoutSize(12, fontScale, 1.25),
        gap: scaledLayoutSize(8, fontScale, 1.2),
        avatarOverlapM: avatarSizeM / 2,
        avatarOverlapL: avatarSizeL / 2,
    };
}

export function useScaledProfileWidgetLinkMetrics() {
    const fontScale = useFontScale();

    return {
        iconSize: scaledLayoutSize(28, fontScale, 1.25),
        iconGlyph: scaledLayoutSize(16, fontScale, 1.2),
        rowPaddingV: scaledLayoutSize(6, fontScale, 1.25),
        rowPaddingH: scaledLayoutSize(8, fontScale, 1.2),
        rowGap: scaledLayoutSize(6, fontScale, 1.2),
    };
}

export function useScaledProfileMusicSizes() {
    const fontScale = useFontScale();

    return {
        art: scaledLayoutSize(52, fontScale, 1.3),
        playButton: scaledLayoutSize(32, fontScale, 1.35),
        miniPlayButton: scaledLayoutSize(22, fontScale, 1.35),
        playIcon: scaledLayoutSize(16, fontScale, 1.25),
        miniPlayIcon: scaledLayoutSize(11, fontScale, 1.2),
        trackArt: scaledLayoutSize(44, fontScale, 1.3),
    };
}

export function useScaledSettingsProfileCardMetrics() {
    const fontScale = useFontScale();
    const avatarSize = scaledLayoutSize(88, fontScale, 1.3);

    return {
        bannerHeight: scaledLayoutSize(72, fontScale, 1.25),
        avatarSize,
        avatarOverlap: avatarSize / 2,
    };
}

export function useScaledMessageInfoWidth() {
    const fontScale = useFontScale();
    return scaledLayoutSize(62, fontScale, 1.5);
}

export function useScaledDescriptionMinHeight(base = 100) {
    const fontScale = useFontScale();
    return scaledLayoutSize(base, fontScale, 1.75);
}

export function useScaledSpaceCreateCardHeight() {
    const fontScale = useFontScale();
    return scaledLayoutSize(300, fontScale, 1.5);
}

export function useScaledWidgetPaletteItemWidth() {
    const fontScale = useFontScale();
    return scaledLayoutSize(64, fontScale, 1.5);
}
