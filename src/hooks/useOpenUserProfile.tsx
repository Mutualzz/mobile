import { UserProfileSheet } from "@components/Profile/UserProfileSheet";
import { useSheet } from "@hooks/useSheet";
import type { AccountStore } from "@stores/Account.store";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { User } from "@stores/objects/User";
import { PROFILE_SHEET_PROPS } from "@utils/sheet";
import { useCallback } from "react";

export function useOpenUserProfile() {
    const { openSheet, closeSheet } = useSheet();

    return useCallback(
        (
            user: User | AccountStore,
            member?: SpaceMember,
            accountMenu = false,
        ) => {
            const id = `user-profile-${user.id}`;
            closeSheet(id);
            openSheet(
                id,
                <UserProfileSheet
                    user={user}
                    member={member}
                    sheetId={id}
                    accountMenu={accountMenu}
                />,
                PROFILE_SHEET_PROPS,
            );
        },
        [openSheet, closeSheet],
    );
}
