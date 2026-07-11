import { LockIcon } from "phosphor-react-native";
import { useTheme } from "@mutualzz/ui-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  size?: number;
  label?: string;
}

export const RoleHierarchyLock = ({ size = 16, label }: Props) => {
  const { theme } = useTheme();
  const { t } = useTranslation("space");
  const a11yLabel = label ?? t("roles.hierarchy.cantReorder");

  return (
    <View accessibilityLabel={a11yLabel} accessibilityRole="image">
      <LockIcon
        size={size}
        weight="fill"
        color={theme.typography.colors.muted}
      />
    </View>
  );
};

export const RoleHierarchyAssignLock = ({ size = 16, label }: Props) => {
  const { t } = useTranslation("space");
  return (
    <RoleHierarchyLock
      size={size}
      label={label ?? t("roles.hierarchy.cantAssign")}
    />
  );
};
