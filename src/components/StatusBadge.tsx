import type { PresenceStatus } from "@mutualzz/types";
import { dynamicElevation } from "@mutualzz/ui-core";
import { Box, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

interface StatusBadgeProps {
  status: PresenceStatus;
  size?: number;
  showInvisible?: boolean;
  inPicker?: boolean;
  elevation?: number;
}

function roundPx(value: number) {
  return Math.max(1, Math.round(value));
}

interface BadgeVisualProps {
  status: PresenceStatus;
  diameter: number;
  ringThickness: number;
  cutColor: string;
  fillColor: string;
  drawOuterRing: boolean;
  hollow: boolean;
  hollowRingColor: string;
}

const BadgeVisual = observer(
  ({
    status,
    diameter,
    ringThickness,
    cutColor,
    fillColor,
    drawOuterRing,
    hollow,
    hollowRingColor,
  }: BadgeVisualProps) => {
    const geometryInset = drawOuterRing ? ringThickness : 0;
    const innerDiameter = Math.max(1, diameter - geometryInset * 2);

    const dndBarHeight = roundPx(innerDiameter * 0.28);
    const dndBarWidth = roundPx(innerDiameter * 0.76);

    const idleCutoutDiameter = roundPx(innerDiameter * 0.78);
    const idleCutoutOffset = roundPx(innerDiameter * 0.18);

    const invisibleRingThickness = Math.max(2, roundPx(innerDiameter * 0.18));

    return (
      <Box
        style={{
          width: diameter,
          height: diameter,
          borderRadius: 9999,
          backgroundColor: fillColor,
          ...(drawOuterRing
            ? { borderWidth: ringThickness, borderColor: cutColor }
            : null),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {status === "dnd" && (
          <Box
            style={{
              width: dndBarWidth,
              height: dndBarHeight,
              borderRadius: 9999,
              backgroundColor: cutColor,
            }}
          />
        )}

        {status === "idle" && (
          <Box
            style={{
              width: idleCutoutDiameter,
              height: idleCutoutDiameter,
              borderRadius: 9999,
              backgroundColor: cutColor,
              transform: [
                { translateX: -idleCutoutOffset },
                { translateY: -idleCutoutOffset },
              ],
            }}
          />
        )}

        {hollow && (
          <Box
            style={{
              width: innerDiameter,
              height: innerDiameter,
              borderRadius: 9999,
              borderWidth: invisibleRingThickness,
              borderColor: hollowRingColor,
              backgroundColor: "transparent",
            }}
          />
        )}
      </Box>
    );
  },
);

export const StatusBadge = observer(
  ({
    status,
    size = 36,
    showInvisible = false,
    inPicker = false,
    elevation = 1,
  }: StatusBadgeProps) => {
    const { theme } = useTheme();

    if (!showInvisible && status === "invisible") return null;
    if (status === "offline") return null;

    const hollow = status === "invisible";
    const cutColor = dynamicElevation(theme.colors.surface, elevation);
    const hollowRingColor = theme.colors.neutral;

    const fillColor = (() => {
      switch (status) {
        case "online":
          return theme.colors.success;
        case "idle":
          return theme.colors.warning;
        case "dnd":
          return theme.colors.danger;
        case "invisible":
          return cutColor;
        default:
          return null;
      }
    })();

    if (fillColor == null) return null;

    if (inPicker) {
      const pickerBoxSize = roundPx(size * 0.6);
      const pickerDotSize = roundPx(size * 0.3);

      return (
        <Box
          style={{
            width: pickerBoxSize,
            height: pickerBoxSize,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BadgeVisual
            status={status}
            diameter={pickerDotSize}
            ringThickness={0}
            cutColor={cutColor}
            fillColor={fillColor}
            drawOuterRing={false}
            hollow={hollow}
            hollowRingColor={hollowRingColor}
          />
        </Box>
      );
    }

    const diameter = roundPx(size * 0.3);
    const ringThickness = roundPx(diameter * 0.16);
    const xNudge = roundPx(diameter * 0.65);
    const yNudge = roundPx(diameter * 0.45);

    return (
      <Box
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          transform: [
            { translateX: diameter / 2 - xNudge },
            { translateY: diameter / 2 - yNudge },
          ],
        }}
      >
        <BadgeVisual
          status={status}
          diameter={diameter}
          ringThickness={ringThickness}
          cutColor={cutColor}
          fillColor={fillColor}
          drawOuterRing={true}
          hollow={hollow}
          hollowRingColor={hollowRingColor}
        />
      </Box>
    );
  },
);
