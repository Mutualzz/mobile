import { useOpenUserProfile } from "@hooks/useOpenUserProfile";
import type { AccountStore } from "@stores/Account.store";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { User } from "@stores/objects/User";
import type { ReactNode } from "react";
import { Pressable } from "react-native";

interface Props {
    user: User | AccountStore;
    member?: SpaceMember;
    disabled?: boolean;
    children: ReactNode;
}

export const UserProfileTrigger = ({
    user,
    member,
    disabled,
    children,
}: Props) => {
    const openProfile = useOpenUserProfile();

    if (disabled) return <>{children}</>;

    return (
        <Pressable onPress={() => openProfile(user, member)}>
            {children}
        </Pressable>
    );
};
