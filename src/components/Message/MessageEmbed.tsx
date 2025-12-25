import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import type { APIMessageEmbed } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

function openUrl(url?: string | null) {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
}

export const MessageEmbed = observer(
    ({ embed }: { embed: APIMessageEmbed }) => {
        const { theme } = useTheme();

        if (embed.spotify) {
            return (
                <View style={styles.webviewWrap}>
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
                <View style={[styles.webviewWrap, styles.youtubeWrap]}>
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

        return (
            <Paper
                style={{
                    width: "100%",
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
                            accessibilityLabel={embed.title ?? "Embed image"}
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
        width: 400,
        height: 80,
        borderRadius: 8,
        overflow: "hidden",
    },

    youtubeWrap: {
        width: 560,
        height: 315,
    },

    webview: {
        flex: 1,
    },
});
