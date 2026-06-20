import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Input, Typography } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

export const ProfileEditorScreen = observer(() => {
    const app = useAppStore();
    const account = app.account;

    const [bio, setBio] = useState("");
    const [backgroundColor, setBackgroundColor] = useState("");
    const [bannerHash, setBannerHash] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: fetchedProfile, isLoading } = useQuery({
        queryKey: ["profile-editor", account?.id],
        enabled: !!account?.id,
        queryFn: () => app.profiles.resolve(account!.id, true),
    });

    const profile = account?.id
        ? (app.profiles.get(account.id) ?? fetchedProfile)
        : undefined;

    useEffect(() => {
        if (!profile) return;

        setBio(profile.bio ?? "");
        setBackgroundColor(profile.backgroundColor ?? "");
        setBannerHash(profile.banner ?? null);
        setBannerPreview(profile.constructBannerUrl());
    }, [profile?.updatedAt, profile?.userId]);

    if (!account) return null;

    const uploadBanner = () => {
        if (uploadingBanner) return;

        ImagePicker.openPicker({
            mediaType: "photo",
            cropping: true,
            width: 1200,
            height: 400,
        })
            .then(async (image) => {
                setUploadingBanner(true);
                setError(null);

                try {
                    const result = await app.profiles.uploadAsset("banner", {
                        uri: image.path,
                        type: image.mime ?? "image/jpeg",
                        name: image.filename ?? "banner.jpg",
                    });

                    setBannerHash(result.hash);
                    setBannerPreview(image.path);
                } catch (e) {
                    setError(getErrorMessage(e, "Failed to upload banner"));
                } finally {
                    setUploadingBanner(false);
                    void ImagePicker.clean();
                }
            })
            .catch(() => undefined)
            .finally(() => {
                void ImagePicker.clean();
            });
    };

    const saveProfile = async () => {
        if (saving || !profile) return;

        setSaving(true);
        setError(null);

        try {
            await app.profiles.save({
                bio: bio.trim() || null,
                banner: bannerHash,
                backgroundColor: backgroundColor.trim() || null,
                backgroundImage: profile.backgroundImage ?? null,
                pageFontFamily: profile.pageFontFamily ?? null,
                introMusic: profile.introMusic ?? null,
                blocks: profile.blocks,
            });
        } catch (e) {
            setError(getErrorMessage(e, "Failed to save profile"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsScreen
            title="Profile Editor"
            contentStyle={{ flex: 1 }}
        >
            {isLoading && !profile ? (
                <Box
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ActivityIndicator />
                </Box>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 32,
                        gap: 16,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Typography level="body-sm" textColor="muted">
                        Edit your profile page content. Block layout editing is
                        read-only on mobile for now.
                    </Typography>

                    <Paper
                        style={{
                            borderRadius: 12,
                            overflow: "hidden",
                            gap: 12,
                            padding: 12,
                        }}
                        elevation={app.settings?.preferEmbossed ? 2 : 0}
                    >
                        <Typography level="body-md" weight={700}>
                            Banner
                        </Typography>
                        {bannerPreview ? (
                            <Image
                                source={{ uri: bannerPreview }}
                                style={{
                                    width: "100%",
                                    height: 120,
                                    borderRadius: 8,
                                }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Box
                                style={{
                                    height: 120,
                                    borderRadius: 8,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(127,127,127,0.15)",
                                }}
                            >
                                <Typography level="body-sm" textColor="muted">
                                    No banner yet
                                </Typography>
                            </Box>
                        )}
                        <Button
                            color="neutral"
                            variant="soft"
                            disabled={uploadingBanner}
                            onPress={uploadBanner}
                        >
                            {uploadingBanner ? "Uploading..." : "Change Banner"}
                        </Button>
                    </Paper>

                    <Paper
                        style={{
                            borderRadius: 12,
                            padding: 12,
                            gap: 12,
                        }}
                        elevation={app.settings?.preferEmbossed ? 2 : 0}
                    >
                        <Typography level="body-md" weight={700}>
                            Bio
                        </Typography>
                        <Input
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell people about yourself"
                            multiline
                            maxLength={2000}
                            style={{ minHeight: 120, textAlignVertical: "top" }}
                        />
                    </Paper>

                    <Paper
                        style={{
                            borderRadius: 12,
                            padding: 12,
                            gap: 12,
                        }}
                        elevation={app.settings?.preferEmbossed ? 2 : 0}
                    >
                        <Typography level="body-md" weight={700}>
                            Background color
                        </Typography>
                        <Input
                            value={backgroundColor}
                            onChangeText={setBackgroundColor}
                            placeholder="#1a1a1a"
                            autoCapitalize="none"
                        />
                    </Paper>

                    <Paper
                        style={{
                            borderRadius: 12,
                            padding: 12,
                            gap: 8,
                        }}
                        elevation={app.settings?.preferEmbossed ? 2 : 0}
                    >
                        <Typography level="body-md" weight={700}>
                            Blocks
                        </Typography>
                        <Typography level="body-sm" textColor="muted">
                            {profile?.blocks.length ?? 0} block
                            {(profile?.blocks.length ?? 0) === 1 ? "" : "s"}{" "}
                            on your page. Use desktop to rearrange or add new
                            blocks.
                        </Typography>
                    </Paper>

                    {error && (
                        <Typography level="body-sm" style={{ color: "#e74c3c" }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        color="primary"
                        disabled={saving || !profile}
                        onPress={() => void saveProfile()}
                    >
                        {saving ? "Saving..." : "Save Profile"}
                    </Button>
                </ScrollView>
            )}
        </SettingsScreen>
    );
});

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    if (
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }
    return fallback;
}
