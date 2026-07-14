import { IconButton } from "@components/IconButton";
import { useTheme } from "@mutualzz/ui-native";
import {
    computeContainedSize,
    getMessageGifMaxWidth,
    MESSAGE_GIF_MAX_HEIGHT,
} from "@utils/gifs";
import { buildVideoHtml, VIDEO_SIZE_SCRIPT } from "@utils/webViewVideo";
import { StarIcon } from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Image,
    Linking,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

interface Props {
    mediaUrl: string;
    imageUrl?: string | null;
    pageUrl?: string | null;
    isFavorited: boolean;
    onToggleFavorite: () => void;
}

export function MessageGifEmbed({
    mediaUrl,
    imageUrl,
    pageUrl,
    isFavorited,
    onToggleFavorite,
}: Props) {
    const { t } = useTranslation("chat");
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const maxWidth = getMessageGifMaxWidth(windowWidth);
    const maxHeight = MESSAGE_GIF_MAX_HEIGHT;

    const isVideo = /\.(mp4|webm)(\?|$)/i.test(mediaUrl);

    const sizingUri = imageUrl || (!isVideo ? mediaUrl : null);

    const [displaySize, setDisplaySize] = useState(() =>
        computeContainedSize(0, 0, maxWidth, maxHeight),
    );

    useEffect(() => {
        if (!sizingUri) return;

        let cancelled = false;
        Image.getSize(
            sizingUri,
            (width, height) => {
                if (cancelled) return;
                setDisplaySize(
                    computeContainedSize(width, height, maxWidth, maxHeight),
                );
            },
            () => {
                if (cancelled) return;
                setDisplaySize(computeContainedSize(0, 0, maxWidth, maxHeight));
            },
        );
        return () => {
            cancelled = true;
        };
    }, [sizingUri, maxWidth, maxHeight]);

    const handleVideoMessage = useCallback(
        (event: WebViewMessageEvent) => {
            try {
                const data = JSON.parse(event.nativeEvent.data) as {
                    type?: string;
                    width?: number;
                    height?: number;
                };

                if (
                    data.type !== "size" ||
                    !data.width ||
                    !data.height
                ) {
                    return;
                }

                setDisplaySize(
                    computeContainedSize(
                        data.width,
                        data.height,
                        maxWidth,
                        maxHeight,
                    ),
                );
            } catch {
                // ignore malformed messages
            }
        },
        [maxWidth, maxHeight],
    );

    const html = useMemo(
        () =>
            buildVideoHtml(mediaUrl, {
                posterUrl: imageUrl,
                autoplay: true,
                loop: true,
                muted: true,
            }),
        [mediaUrl, imageUrl],
    );

    const openPage = () => {
        if (!pageUrl) return;
        Linking.openURL(pageUrl).catch(() => undefined);
    };

    return (
        <View style={[styles.wrap, { width: displaySize.width }]}>
            {isVideo ? (
                <WebView
                    source={{ html }}
                    style={[
                        styles.media,
                        {
                            width: displaySize.width,
                            height: displaySize.height,
                        },
                    ]}
                    scrollEnabled={false}
                    javaScriptEnabled
                    injectedJavaScript={VIDEO_SIZE_SCRIPT}
                    onMessage={handleVideoMessage}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    originWhitelist={["*"]}
                    backgroundColor="transparent"
                />
            ) : (
                <Pressable onPress={openPage} disabled={!pageUrl}>
                    <Image
                        source={{ uri: imageUrl || mediaUrl }}
                        style={[
                            styles.media,
                            {
                                width: displaySize.width,
                                height: displaySize.height,
                            },
                        ]}
                        resizeMode="contain"
                    />
                </Pressable>
            )}

            <IconButton
                padding={6}
                color="neutral"
                onPress={onToggleFavorite}
                accessibilityLabel={
                    isFavorited ? t("favorites.remove") : t("favorites.add")
                }
                style={styles.favoriteBtn}
            >
                <StarIcon
                    size={14}
                    color={isFavorited ? theme.colors.warning : "#fff"}
                    weight={isFavorited ? "fill" : "regular"}
                />
            </IconButton>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: "relative",
        alignSelf: "flex-start",
        maxWidth: "100%",
    },
    media: {
        borderRadius: 8,
        backgroundColor: "transparent",
    },
    favoriteBtn: {
        position: "absolute",
        top: 6,
        right: 6,
        backgroundColor: "rgba(0,0,0,0.55)",
        borderRadius: 6,
    },
});
