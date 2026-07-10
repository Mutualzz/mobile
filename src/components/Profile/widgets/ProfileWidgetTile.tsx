import type { ProfileBlockSize, ProfileBlockType } from "@mutualzz/types";
import { Paper, useTheme } from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import { CaretDownIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { getWidgetTileHeight } from "./profileWidget.constants";

interface Props {
  type: ProfileBlockType;
  size: ProfileBlockSize;
  onMaximize?: () => void;
  children: ReactNode;
}

const FADE_ALPHAS = ["00", "18", "40", "80"];

export function ProfileWidgetTile({ type, size, onMaximize, children }: Props) {
  const { theme } = useTheme();
  const fadeBandHeight = useScaledSquareSize(28);

  const content = (
    <Paper
      elevation={1}
      style={{
        width: "100%",
        height: getWidgetTileHeight(type, size),
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}

      {onMaximize ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: fadeBandHeight,
          }}
        >
          {FADE_ALPHAS.map((alpha, i) => (
            <View
              key={alpha}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: (fadeBandHeight / FADE_ALPHAS.length) * (i + 1),
                backgroundColor: `${theme.colors.background}${alpha}`,
              }}
            />
          ))}
          <Pressable
            onPress={onMaximize}
            accessibilityRole="button"
            accessibilityLabel={`Expand ${type} widget`}
            accessibilityHint="Opens the full widget content"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: fadeBandHeight,
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 3,
            }}
          >
            <CaretDownIcon size={12} color={theme.typography.colors.muted} />
          </Pressable>
        </View>
      ) : null}
    </Paper>
  );

  return content;
}
