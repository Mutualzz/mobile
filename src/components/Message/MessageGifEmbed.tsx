import { IconButton } from "@components/IconButton";
import { useTheme } from "@mutualzz/ui-native";
import {
    computeContainedSize,
    getMessageGifMaxWidth,
    MESSAGE_GIF_MAX_HEIGHT,
} from "@utils/gifs";
import { StarIcon } from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const VIDEO_SIZE_SCRIPT = `
(function () {
  var video = document.querySelector("video");
  if (!video) return;

  function sendSize() {
    var width = video.videoWidth;
    var height = video.videoHeight;
    if (!width || !height) return;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "size", width: width, height: height })
    );
  }

  video.addEventListener("loadedmetadata", sendSize);
  video.addEventListener("loadeddata", sendSize);
})();
true;
`;

function buildGifVideoHtml(mediaUrl: string, posterUrl?: string | null) {
    const poster = posterUrl ? ` poster="${posterUrl}"` : "";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        overflow: hidden;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      video {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <video src="${mediaUrl}"${poster} autoplay loop muted playsinline></video>
  </body>
</html>`;
}

export function MessageGifEmbed({
    mediaUrl,
    imageUrl,
    pageUrl,
    isFavorited,
    onToggleFavorite,
}: Props) {
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

        Image.getSize(
            sizingUri,
            (width, height) => {
                setDisplaySize(
                    computeContainedSize(width, height, maxWidth, maxHeight),
                );
            },
            () => {
                setDisplaySize(computeContainedSize(0, 0, maxWidth, maxHeight));
            },
        );
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
        () => buildGifVideoHtml(mediaUrl, imageUrl),
        [mediaUrl, imageUrl],
    );

    const openPage = () => {
        if (!pageUrl) return;
        Linking.openURL(pageUrl).catch(() => {});
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
                    isFavorited ? "Remove from favorites" : "Add to favorites"
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
