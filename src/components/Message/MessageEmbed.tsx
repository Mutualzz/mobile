import { Paper } from "@components/Paper";
import { PostEmbedPreview } from "@components/Feed/PostEmbedPreview";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import type { APIMessageEmbed } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { openExternalLink } from "@utils/openExternalLink";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import WebView from "react-native-webview";
import { MessageEmbedSpoiler } from "./MessageEmbedSpoiler";
import { MessageGifEmbed } from "./MessageGifEmbed";

function openUrl(app: ReturnType<typeof useAppStore>, url?: string | null) {
    if (!url) return;
    void openExternalLink(app, url);
}

export const MessageEmbed = observer(
    ({ embed, compact }: { embed: APIMessageEmbed; compact?: boolean }) => {
        const { t } = useTranslation("chat");
        const app = useAppStore();
        const { theme } = useTheme();
        const { width } = useWindowDimensions();
        const maxEmbedWidth = compact
            ? Math.min(width - 120, 280)
            : Math.min(width - 80, 560);
        const spotifyEmbedHeight = useScaledSquareSize(80);
        const youtubeHeight = Math.round(maxEmbedWidth * (9 / 16));

        if (embed.spotify) {
            return (
                <MessageEmbedSpoiler
                    spoiler={embed.spoiler}
                    width={maxEmbedWidth}
                    height={spotifyEmbedHeight}
                    borderRadius={8}
                >
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
                </MessageEmbedSpoiler>
            );
        }

        if (embed.youtube) {
            return (
                <MessageEmbedSpoiler
                    spoiler={embed.spoiler}
                    width={maxEmbedWidth}
                    height={youtubeHeight}
                    borderRadius={8}
                >
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
                </MessageEmbedSpoiler>
            );
        }

        if (embed.type === "post" && embed.post) {
            return <PostEmbedPreview post={embed.post} />;
        }

        const gifAutoplay = app.settings?.gifAutoplay ?? true;

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
                    <MessageEmbedSpoiler spoiler={embed.spoiler}>
                        <MessageGifEmbed
                            mediaUrl={mediaUrl}
                            imageUrl={embed.image}
                            pageUrl={embed.url}
                            isFavorited={isFavorited}
                            onToggleFavorite={handleToggleFavorite}
                            compact={compact}
                            autoplay={gifAutoplay}
                        />
                    </MessageEmbedSpoiler>
                );
            }
        }

        return (
            <MessageEmbedSpoiler spoiler={embed.spoiler}>
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
                        onPress={() => openUrl(app, embed.url)}
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
            </MessageEmbedSpoiler>
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
