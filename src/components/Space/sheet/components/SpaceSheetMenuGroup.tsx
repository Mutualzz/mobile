import { Paper } from "@components/Paper";
import { SpaceSheetMenuRow } from "./SpaceSheetMenuRow";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { Divider } from "@mutualzz/ui-native";
import type { IconProps } from "phosphor-react-native";
import type { ComponentType, ReactNode } from "react";
import { Fragment } from "react";

interface Props {
  children: ReactNode;
}

export interface SpaceSheetMenuItem {
  key: string;
  label: string;
  Icon?: ComponentType<IconProps>;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export function SpaceSheetMenuGroup({ children }: Props) {
  return (
    <Paper
      style={{
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </Paper>
  );
}

export function SpaceSheetMenuDivider() {
  return (
    <Divider lineColor="muted" style={{ marginLeft: 16, opacity: 0.45 }} />
  );
}

function SpaceSheetMenuGroupRow({ item }: { item: SpaceSheetMenuItem }) {
  const navIconColor = useSettingsIconColor("info");
  const dangerIconColor = useSettingsIconColor("danger");
  const { Icon, danger, disabled } = item;
  const iconColor = danger ? dangerIconColor : navIconColor;

  return (
    <SpaceSheetMenuRow
      label={item.label}
      onPress={item.onPress}
      disabled={item.disabled}
      danger={item.danger}
      startDecorator={
        Icon ? (
          <Icon
            size={20}
            weight="fill"
            color={iconColor}
            style={disabled ? { opacity: 0.45 } : undefined}
          />
        ) : undefined
      }
    />
  );
}

interface GroupRowsProps {
  rows: SpaceSheetMenuItem[];
}

export function SpaceSheetMenuGroupRows({ rows }: GroupRowsProps) {
  return (
    <SpaceSheetMenuGroup>
      {rows.map((row, index) => (
        <Fragment key={row.key}>
          {index > 0 ? <SpaceSheetMenuDivider /> : null}
          <SpaceSheetMenuGroupRow item={row} />
        </Fragment>
      ))}
    </SpaceSheetMenuGroup>
  );
}

interface GroupChildrenProps {
  rows: ReactNode[];
}

export function SpaceSheetMenuGroupChildren({ rows }: GroupChildrenProps) {
  return (
    <SpaceSheetMenuGroup>
      {rows.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? <SpaceSheetMenuDivider /> : null}
          {child}
        </Fragment>
      ))}
    </SpaceSheetMenuGroup>
  );
}
