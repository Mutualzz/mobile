import { UserProfileSheet } from "@components/Profile/UserProfileSheet";
import { useModal } from "@hooks/useModal";
import type { AccountStore } from "@stores/Account.store";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { User } from "@stores/objects/User";
import { useCallback } from "react";

export function useOpenUserProfile() {
    const { openModal, closeModal } = useModal();

    return useCallback(
        (user: User | AccountStore, member?: SpaceMember) => {
            const id = `user-profile-${user.id}`;
            closeModal(id);
            openModal(
                id,
                <UserProfileSheet user={user} member={member} modalId={id} />,
                { style: { padding: 16 } },
            );
        },
        [openModal, closeModal],
    );
}
