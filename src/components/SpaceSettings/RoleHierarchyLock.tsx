import { LockIcon } from "phosphor-react-native";
import { useTheme } from "@mutualzz/ui-native";
import { View } from "react-native";
import {
  ROLE_HIERARCHY_ASSIGN_LABEL,
  ROLE_HIERARCHY_LOCK_LABEL,
} from "./roleHierarchy.utils";

interface Props {
  size?: number;
  label?: string;
}

export const RoleHierarchyLock = ({
  size = 16,
  label = ROLE_HIERARCHY_LOCK_LABEL,
}: Props) => {
  const { theme } = useTheme();

  return (
    <View accessibilityLabel={label} accessibilityRole="image">
      <LockIcon
        size={size}
        weight="fill"
        color={theme.typography.colors.muted}
      />
    </View>
  );
};

export const RoleHierarchyAssignLock = ({
  size = 16,
  label = ROLE_HIERARCHY_ASSIGN_LABEL,
}: Props) => (
  <RoleHierarchyLock size={size} label={label} />
);
