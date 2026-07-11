import { Paper } from "@components/Paper";
import { PostEmbedPreview } from "@components/Feed/PostEmbedPreview";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { APIMessageEmbed } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image, Linking, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import WebView from "react-native-webview";
import { MessageGifEmbed } from "./MessageGifEmbed";

function openUrl(url?: string | null) {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
}

export const MessageEmbed = observer(
    ({ embed }: { embed: APIMessageEmbed }) => {
        const { t } = useTranslation("chat");
        const app = useAppStore();
        const { theme } = useTheme();
        const { width } = useWindowDimensions();
        const maxEmbedWidth = Math.min(width - 80, 560);
        const spotifyEmbedHeight = useScaledSquareSize(80);
        const youtubeHeight = Math.round(maxEmbedWidth * (9 / 16));

        if (embed.spotify) {
            return (
                <View style={[styles.webviewWrap, { width: maxEmbedWidth, height: spotifyEmbedHeight }]}>
                    <WebView
                        testID="embed-webview"
                        source={{ uri: embed.spotify.embedUrl }}
                        style={styles.webview}
                        scrollEnabled={false}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsInlineMediaPlayback
                        mediaPlaybackRequiresUserAction={false}
                    />
                </View>
            );
        }

        if (embed.youtube) {
            return (
                <View
                    style={[
                        styles.webviewWrap,
                        styles.youtubeWrap,
                        { width: maxEmbedWidth, height: youtubeHeight },
                    ]}
                >
                    <WebView
                        testID="embed-webview"
                        source={{ uri: embed.youtube.embedUrl }}
                        style={styles.webview}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                    />
                </View>
            );
        }

        if (embed.type === "post" && embed.post) {
            return <PostEmbedPreview post={embed.post} />;
        }

        if (embed.type === "gifv") {
            const mediaUrl = embed.media || embed.image || embed.url || "";
            const gifUrl = embed.url ?? "";
            const isFavorited =
                app.settings?.favoriteGifs?.some((f) =>
                    f.startsWith(gifUrl),
                ) ?? false;

            const handleToggleFavorite = () => {
                if (!gifUrl) return;
                const preview = embed.image ?? embed.media ?? "";
                const entry = preview ? `${gifUrl}|${preview}` : gifUrl;
                app.settings?.toggleFavoriteGif(entry);
            };

            if (mediaUrl) {
                return (
                    <MessageGifEmbed
                        mediaUrl={mediaUrl}
                        imageUrl={embed.image}
                        pageUrl={embed.url}
                        isFavorited={isFavorited}
                        onToggleFavorite={handleToggleFavorite}
                    />
                );
            }
        }

        return (
            <Paper
                style={{
                    width: "100%",
                    maxWidth: maxEmbedWidth,
                    flexDirection: "column",
                    borderRadius: 8,
                    padding: 8,
                    gap: 10,
                    borderStyle: "solid",
                    borderColor: embed.color ?? theme.colors.primary,
                    borderWidth: 2,
                }}
            >
                <Box
                    style={{
                        flexDirection: "row",
                        gap: 8,
                        alignItems: "center",
                    }}
                >
                    {embed.author?.iconUrl && (
                        <UserAvatar src={embed.author?.iconUrl} />
                    )}
                    {embed.author?.name && (
                        <Typography>{embed.author?.name}</Typography>
                    )}
                </Box>
                {embed.title && (
                    <Typography weight="bold">{embed.title}</Typography>
                )}
                {embed.description && (
                    <Typography level="body-sm">{embed.description}</Typography>
                )}
                {embed.image && !embed.media && (
                    <Pressable
                        onPress={() => openUrl(embed.url)}
                        style={styles.imagePressable}
                    >
                        <Image
                            source={{ uri: embed.image }}
                            accessibilityLabel={embed.title ?? t("a11y.embedImage")}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </Pressable>
                )}
            </Paper>
        );
    },
);

const styles = StyleSheet.create({
    imagePressable: {
        borderRadius: 8,
        overflow: "hidden",
    },

    image: {
        width: "100%",
        height: 200,
    },

    webviewWrap: {
        borderRadius: 8,
        overflow: "hidden",
    },

    youtubeWrap: {},

    webview: {
        flex: 1,
    },
});
