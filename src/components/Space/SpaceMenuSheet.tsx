import { Paper } from "@components/Paper";
import { SpaceActionConfirmSheet } from "@components/SpaceSettings/SpaceActionConfirmSheet";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import {
    getVisibleSpaceSettingsPages,
    type SpaceSettingsPage,
} from "@components/SpaceSettings/spaceSettingsPages";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { GearIcon, SignOutIcon, TrashIcon } from "phosphor-react-native";
import startCase from "lodash-es/startCase";
import { observer } from "mobx-react-lite";
import { Modal, Pressable, ScrollView } from "react-native";

interface Props {
    space: Space;
    visible: boolean;
    onClose: () => void;
}

export const SpaceMenuSheet = observer(({ space, visible, onClose }: Props) => {
    const app = useAppStore();
    const { navigate } = useAppNavigation();
    const { openModal } = useModal();
    const navIconColor = useSettingsIconColor("info");
    const dangerIconColor = useSettingsIconColor("danger");

    const me = space.members.me;
    const categories = me ? getVisibleSpaceSettingsPages(me) : [];
    const isOwner = space.ownerId === app.account?.id;

    const openSettings = (page?: SpaceSettingsPage) => {
        onClose();
        navigate(
            page
                ? `/(tabs)/spaces/${space.id}/settings/${page}`
                : `/(tabs)/spaces/${space.id}/settings`,
        );
    };

    const confirmLeave = () => {
        onClose();
        openModal(
            "leave-space-confirm",
            <SpaceActionConfirmSheet
                space={space}
                action="leave"
                modalId="leave-space-confirm"
            />,
        );
    };

    const confirmDelete = () => {
        onClose();
        openModal(
            "delete-space-confirm",
            <SpaceActionConfirmSheet
                space={space}
                action="delete"
                modalId="delete-space-confirm"
            />,
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Box
                style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: "rgba(0,0,0,0.45)",
                }}
            >
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                <Paper
                    variant="elevation"
                    elevation={3}
                    style={{
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        padding: 16,
                        gap: 12,
                        maxHeight: "70%",
                    }}
                >
                        <Typography level="body-lg" weight="bold">
                            {space.name}
                        </Typography>

                        <ScrollView
                            contentContainerStyle={{ gap: 8 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Button
                                variant="soft"
                                horizontalAlign="left"
                                startDecorator={
                                    <GearIcon
                                        size={20}
                                        weight="fill"
                                        color={navIconColor}
                                    />
                                }
                                onPress={() => openSettings()}
                            >
                                Space settings
                            </Button>

                            {categories.map(({ category, pages }) => (
                                <Box key={category} style={{ gap: 6 }}>
                                    <Typography
                                        level="body-xs"
                                        textColor="muted"
                                    >
                                        {startCase(category)}
                                    </Typography>
                                    {pages.map((page) => (
                                        <Button
                                            key={page.label}
                                            variant="plain"
                                            horizontalAlign="left"
                                            startDecorator={
                                                <page.Icon
                                                    size={20}
                                                    weight="fill"
                                                    color={navIconColor}
                                                />
                                            }
                                            onPress={() =>
                                                openSettings(page.label)
                                            }
                                        >
                                            {startCase(page.label)}
                                        </Button>
                                    ))}
                                </Box>
                            ))}

                            {!isOwner ? (
                                <Button
                                    variant="plain"
                                    color="danger"
                                    horizontalAlign="left"
                                    startDecorator={
                                        <SignOutIcon
                                            size={20}
                                            weight="fill"
                                            color={dangerIconColor}
                                        />
                                    }
                                    onPress={confirmLeave}
                                >
                                    Leave space
                                </Button>
                            ) : (
                                <Button
                                    variant="plain"
                                    color="danger"
                                    horizontalAlign="left"
                                    startDecorator={
                                        <TrashIcon
                                            size={20}
                                            weight="fill"
                                            color={dangerIconColor}
                                        />
                                    }
                                    onPress={confirmDelete}
                                >
                                    Delete space
                                </Button>
                            )}
                        </ScrollView>

                        <Button variant="plain" color="neutral" onPress={onClose}>
                            Cancel
                        </Button>
                    </Paper>
            </Box>
        </Modal>
    );
});
