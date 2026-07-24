import { formatColor } from "@mutualzz/ui-core";

import { Typography, useTheme } from "@mutualzz/ui-native";

import * as ContextMenuPrimitive from "@rn-primitives/context-menu";

import { type ReactNode, Fragment } from "react";

import {

  Platform,

  StyleSheet,

  View,

  type ViewStyle,

} from "react-native";

import { FullWindowOverlay } from "react-native-screens";



export const ContextMenu = ContextMenuPrimitive.Root;

export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export const ContextMenuGroup = ContextMenuPrimitive.Group;



const WindowOverlay = Platform.OS === "ios" ? FullWindowOverlay : Fragment;



interface ContextMenuContentProps {

  children: ReactNode;

  side?: "top" | "bottom";

  align?: "start" | "center" | "end";

  sideOffset?: number;

  alignOffset?: number;

  style?: ViewStyle;

}



export function ContextMenuContent({

  children,

  side = "bottom",

  align = "start",

  sideOffset = 4,

  alignOffset = 0,

  style,

}: ContextMenuContentProps) {

  const { theme } = useTheme();

  const borderColor = formatColor(theme.typography.colors.muted, {

    alpha: 0.2,

    format: "hexa",

  });

  const shadowColor = formatColor(theme.typography.colors.primary, {

    alpha: 0.18,

    format: "hexa",

  });



  return (

    <ContextMenuPrimitive.Portal>

      <WindowOverlay>

        <ContextMenuPrimitive.Overlay style={StyleSheet.absoluteFill} />

        <ContextMenuPrimitive.Content

          side={side}

          align={align}

          sideOffset={sideOffset}

          alignOffset={alignOffset}

          style={{

            minWidth: 220,

            maxWidth: 300,

            borderRadius: 6,

            borderWidth: StyleSheet.hairlineWidth,

            borderColor,

            backgroundColor: theme.colors.surface,

            paddingVertical: 2,

            overflow: "hidden",

            shadowColor,

            shadowOffset: { width: 0, height: 2 },

            shadowOpacity: 1,

            shadowRadius: 8,

            elevation: 10,

            zIndex: 1,

            ...style,

          }}

        >

          {children}

        </ContextMenuPrimitive.Content>

      </WindowOverlay>

    </ContextMenuPrimitive.Portal>

  );

}



interface ContextMenuItemProps {

  label: string;

  onPress: () => void;

  disabled?: boolean;

  icon?: ReactNode;

}



export function ContextMenuItem({

  label,

  onPress,

  disabled = false,

  icon,

}: ContextMenuItemProps) {

  const { theme } = useTheme();

  const pressedBackground = formatColor(theme.typography.colors.primary, {

    alpha: 0.08,

    format: "hexa",

  });



  return (

    <ContextMenuPrimitive.Item

      disabled={disabled}

      onPress={onPress}

      textValue={label}

      style={({ pressed }) => ({

        flexDirection: "row",

        alignItems: "center",

        gap: 8,

        paddingHorizontal: 10,

        paddingVertical: 6,

        minHeight: 32,

        opacity: disabled ? 0.35 : 1,

        backgroundColor: pressed && !disabled ? pressedBackground : "transparent",

      })}

    >

      {icon ? <View style={{ width: 16, alignItems: "center" }}>{icon}</View> : null}

      <Typography level="body-sm" weight={500} numberOfLines={1} style={{ flex: 1 }}>

        {label}

      </Typography>

    </ContextMenuPrimitive.Item>

  );

}



interface ContextMenuLabelProps {

  children: string;

}



export function ContextMenuLabel({ children }: ContextMenuLabelProps) {

  return (

    <ContextMenuPrimitive.Label asChild>

      <View style={{ paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 }}>

        <Typography level="body-xs" weight={700} truncate="single">

          {children}

        </Typography>

      </View>

    </ContextMenuPrimitive.Label>

  );

}



export function ContextMenuSeparator() {

  const { theme } = useTheme();

  const lineColor = formatColor(theme.typography.colors.muted, {

    alpha: 0.25,

    format: "hexa",

  });



  return (

    <ContextMenuPrimitive.Separator asChild>

      <View

        style={{

          height: StyleSheet.hairlineWidth,

          backgroundColor: lineColor,

          marginVertical: 2,

          marginHorizontal: 6,

        }}

      />

    </ContextMenuPrimitive.Separator>

  );

}


