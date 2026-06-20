import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { APIPrivateUser } from "@mutualzz/types";
import {
    Box,
    Button,
    Divider,
    Input,
    Typography,
} from "@mutualzz/ui-native";
import type { ColorLike } from "@mutualzz/ui-core";
import { observer } from "mobx-react-lite";
import {
    CaretRightIcon,
    ImagesIcon,
    PaintBrushIcon,
    PaletteIcon,
    UploadSimpleIcon,
} from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import ImagePicker from "react-native-image-crop-picker";

const METHOD_CARDS = [
    {
        method: "upload",
        title: "Upload",
        description: "Use a photo or GIF from your library.",
        icon: UploadSimpleIcon,
    },
    {
        method: "draw",
        title: "Draw",
        description: "Sketch a custom avatar on the canvas.",
        icon: PaintBrushIcon,
    },
    {
        method: "avatars",
        title: "Avatars",
        description: "Pick a default style or restore a previous one.",
        icon: ImagesIcon,
    },
] as const;

export const UserProfileSettings = observer(() => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const iconColor = useSettingsIconColor();
    const mutedIconColor = useSettingsIconColor("neutral");
    const primaryIconColor = useSettingsIconColor("primary");
    const account = app.account;
    const embossed = app.settings?.preferEmbossed;

    const [globalName, setGlobalName] = useState(account?.globalName ?? "");
    const [savingName, setSavingName] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setGlobalName(account?.globalName ?? "");
    }, [account?.globalName]);

    if (!account) return null;

    const trimmedName = globalName.trim();
    const hasNameChanges = trimmedName !== (account.globalName ?? "");

    const saveDisplayName = async () => {
        if (!hasNameChanges || savingName || !trimmedName) return;

        setSavingName(true);
        setError(null);

        try {
            const updated = await app.rest.patch<APIPrivateUser>("@me", {
                globalName: trimmedName,
            });
            if (updated) {
                app.setUser(updated);
                app.users.update(updated);
            }
        } catch (e) {
            setError(getErrorMessage(e, "Failed to update display name"));
        } finally {
            setSavingName(false);
        }
    };

    const uploadAvatar = () => {
        if (uploadingAvatar) return;

        ImagePicker.openPicker({
            mediaType: "photo",
            cropping: true,
            cropperCircleOverlay: true,
        })
            .then(async (image) => {
                setUploadingAvatar(true);
                setError(null);

                try {
                    const formData = new FormData();
                    formData.append("avatar", {
                        uri: image.path,
                        type: image.mime ?? "image/jpeg",
                        name: image.filename ?? "avatar.jpg",
                    } as unknown as Blob);

                    if (image.cropRect) {
                        formData.append("crop", JSON.stringify(image.cropRect));
                    }

                    const updated = await app.rest.patchFormData<APIPrivateUser>(
                        "@me",
                        formData,
                    );

                    if (updated) {
                        app.setUser(updated);
                        app.users.update(updated);
                    }
                } catch (e) {
                    setError(getErrorMessage(e, "Failed to upload avatar"));
                } finally {
                    setUploadingAvatar(false);
                    void ImagePicker.clean();
                }
            })
            .catch(() => undefined)
            .finally(() => {
                void ImagePicker.clean();
            });
    };

    const removeAvatar = async () => {
        if (removingAvatar || !account.avatar) return;

        setRemovingAvatar(true);
        setError(null);

        try {
            const updated = await app.rest.patch<APIPrivateUser>("@me", {
                avatar: null,
            });
            if (updated) {
                app.setUser(updated);
                app.users.update(updated);
            }
        } catch (e) {
            setError(getErrorMessage(e, "Failed to remove avatar"));
        } finally {
            setRemovingAvatar(false);
        }
    };

    return (
        <Box style={{ gap: 16 }}>
            <Paper
                style={{
                    borderRadius: 12,
                    overflow: "hidden",
                }}
                elevation={embossed ? 2 : 0}
            >
                <Paper
                    variant="solid"
                    color={account.accentColor as ColorLike}
                    style={{
                        height: 72,
                        width: "100%",
                        borderRadius: 0,
                    }}
                />
                <Box
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-end",
                        gap: 12,
                        paddingHorizontal: 16,
                        paddingBottom: 16,
                        marginTop: -44,
                    }}
                >
                    <UserAvatar user={account} size={88} />
                    <Box style={{ flex: 1, minWidth: 0, paddingBottom: 4, gap: 2 }}>
                        <Typography level="title-md" weight={700}>
                            {account.displayName}
                        </Typography>
                        <Typography level="body-sm" textColor="muted">
                            @{account.username}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Paper
                variant="soft"
                style={{
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                }}
                elevation={embossed ? 2 : 0}
            >
                <Box style={{ gap: 4 }}>
                    <Typography level="body-md" weight={700}>
                        Avatar studio
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                        Upload a new avatar or jump in quickly below.
                    </Typography>
                </Box>
                <Button
                    color="primary"
                    disabled={uploadingAvatar}
                    onPress={uploadAvatar}
                >
                    {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
                </Button>
            </Paper>

            <Box style={{ gap: 8 }}>
                {METHOD_CARDS.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Pressable key={card.method} onPress={uploadAvatar}>
                            <Paper
                                variant="soft"
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 12,
                                    minWidth: 0,
                                }}
                                elevation={embossed ? 1 : 0}
                            >
                                <Paper
                                    variant="plain"
                                    style={{
                                        padding: 8,
                                        borderRadius: 10,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon
                                        size={22}
                                        weight="fill"
                                        color={iconColor}
                                    />
                                </Paper>
                                <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                                    <Typography level="body-sm" weight={700}>
                                        {card.title}
                                    </Typography>
                                    <Typography
                                        level="body-xs"
                                        textColor="muted"
                                        numberOfLines={2}
                                    >
                                        {card.description}
                                    </Typography>
                                </Box>
                                <CaretRightIcon
                                    size={18}
                                    weight="bold"
                                    color={mutedIconColor}
                                    style={{ flexShrink: 0 }}
                                />
                            </Paper>
                        </Pressable>
                    );
                })}
            </Box>

            <Button
                disabled={removingAvatar || !account.avatar}
                color="neutral"
                variant="plain"
                size="sm"
                onPress={() => void removeAvatar()}
                style={{ alignSelf: "flex-start" }}
            >
                Remove current avatar
            </Button>

            <Divider lineColor="muted" style={{ opacity: 0.35 }} />

            <Paper
                variant="soft"
                style={{
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                }}
                elevation={embossed ? 2 : 0}
            >
                <Box style={{ gap: 4 }}>
                    <Typography level="body-md" weight={700}>
                        Display name
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                        Update how your name appears across Mutualzz.
                    </Typography>
                </Box>

                <Input
                    value={globalName}
                    onChangeText={setGlobalName}
                    placeholder={account.username}
                    maxLength={32}
                />

                <Box style={{ gap: 4 }}>
                    <Typography level="body-xs" textColor="muted">
                        Username
                    </Typography>
                    <Typography level="body-md">@{account.username}</Typography>
                </Box>

                {error && (
                    <Typography level="body-sm" style={{ color: "#e74c3c" }}>
                        {error}
                    </Typography>
                )}

                <Button
                    color="primary"
                    disabled={!hasNameChanges || !trimmedName || savingName}
                    onPress={() => void saveDisplayName()}
                >
                    {savingName ? "Saving..." : "Save changes"}
                </Button>
            </Paper>

            <Divider lineColor="muted" style={{ opacity: 0.35 }} />

            <Paper
                variant="soft"
                style={{
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                }}
                elevation={embossed ? 2 : 0}
            >
                <Box style={{ gap: 4 }}>
                    <Typography level="body-md" weight={700}>
                        Profile page
                    </Typography>
                    <Typography level="body-sm" textColor="muted">
                        Customize your MySpace-style page with blocks, banner,
                        bio, and intro music.
                    </Typography>
                </Box>
                <Button
                    color="primary"
                    startDecorator={
                        <PaletteIcon
                            weight="fill"
                            size={18}
                            color={primaryIconColor}
                        />
                    }
                    onPress={() => navigate("/(tabs)/settings/profile-editor")}
                >
                    Customize Profile
                </Button>
            </Paper>
        </Box>
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
