import { UserProfileSheet } from "@components/Profile/UserProfileSheet";
import { useModal } from "@hooks/useModal";
import type { AccountStore } from "@stores/Account.store";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { User } from "@stores/objects/User";
import { MODAL_SHEET_WRAPPER_STYLE } from "@utils/modalSheet";
import { useCallback } from "react";
import { View } from "react-native";

export function useOpenUserProfile() {
    const { openModal, closeModal } = useModal();

    return useCallback(
        (
            user: User | AccountStore,
            member?: SpaceMember,
            accountMenu = false,
        ) => {
            const id = `user-profile-${user.id}`;
            closeModal(id);
            openModal(
                id,
                <View pointerEvents="box-none" style={MODAL_SHEET_WRAPPER_STYLE}>
                    <UserProfileSheet
                        user={user}
                        member={member}
                        modalId={id}
                        accountMenu={accountMenu}
                    />
                </View>,
                {
                    layout: "fullscreen",
                    showCloseButton: false,
                    style: {
                        justifyContent: "flex-end",
                        alignItems: "stretch",
                        backgroundColor: "transparent",
                        paddingVertical: 0,
                    },
                },
            );
        },
        [openModal, closeModal],
    );
}
