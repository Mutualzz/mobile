import { Button } from "@components/Button";
import { type ColorLike } from "@mutualzz/ui-core";
import {
  Box,
  IconButton,
  InputColor,
  Slider,
  Typography,
} from "@mutualzz/ui-native";
import { useScaledSquareSize } from "@utils/accessibilityLayout";
import {
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  EraserIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PanResponder,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { PROFILE_DRAW_CANVAS_SIZE } from "./drawCanvas.constants";
import {
  brushContrastsWithBackground,
  getDefaultBrushColor,
  normalizeHexColor,
  resolveInitialBrushColor,
  visibleBrushColors,
} from "./drawCanvas.utils";

export interface DrawStroke {
  d: string;
  color: string;
  width: number;
}

export interface DrawCanvasState {
  strokes: DrawStroke[];
  backgroundColor: string;
  canvasSize?: number;
}

const DEFAULT_BACKGROUND = "#1a1a2e";

export function renderStrokesToSvg(state: DrawCanvasState): string {
  const canvasSize = state.canvasSize ?? PROFILE_DRAW_CANVAS_SIZE;
  const paths = state.strokes
    .map(
      (s) =>
        `<path d="${s.d}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join("");

  return `<svg viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg"><rect width="${canvasSize}" height="${canvasSize}" fill="${state.backgroundColor}" />${paths}</svg>`;
}

interface Props {
  initial: DrawCanvasState | null;
  onCancel: () => void;
  onSave: (state: DrawCanvasState) => void;
  onSaveDraft?: (state: DrawCanvasState) => void;
  canvasSize?: number;
  maskShape?: "square" | "circle";
  saveLabel?: string;
  saveDraftLabel?: string;
  disableActions?: boolean;
  defaultBackgroundColor?: string;
}

export function ProfileDrawCanvas({
  initial,
  onCancel,
  onSave,
  onSaveDraft,
  canvasSize = PROFILE_DRAW_CANVAS_SIZE,
  maskShape = "square",
  saveLabel,
  saveDraftLabel,
  disableActions = false,
  defaultBackgroundColor = DEFAULT_BACKGROUND,
}: Props) {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const resolvedSaveLabel = saveLabel ?? t("profile.draw.saveDrawing");
  const resolvedSaveDraftLabel = saveDraftLabel ?? t("profile.draw.saveDraft");
  const { width: windowWidth } = useWindowDimensions();
  const brushButtonSize = useScaledSquareSize(28);
  const layoutSize = Math.min(canvasSize, Math.max(240, windowWidth - 48));

  const [strokes, setStrokes] = useState<DrawStroke[]>(initial?.strokes ?? []);
  const [redoStack, setRedoStack] = useState<DrawStroke[]>([]);
  const [backgroundColor, setBackgroundColor] = useState(() =>
    normalizeHexColor(
      initial?.backgroundColor ?? defaultBackgroundColor,
      normalizeHexColor(defaultBackgroundColor),
    ),
  );
  const [brushColor, setBrushColor] = useState(() =>
    resolveInitialBrushColor(
      normalizeHexColor(
        initial?.backgroundColor ?? defaultBackgroundColor,
        normalizeHexColor(defaultBackgroundColor),
      ),
      initial,
    ),
  );
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [erasing, setErasing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const currentPathRef = useRef<string | null>(null);

  const activeColor = erasing ? backgroundColor : brushColor;
  const activeColorRef = useRef(activeColor);
  const strokeWidthRef = useRef(strokeWidth);
  const layoutSizeRef = useRef(layoutSize);

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  useEffect(() => {
    layoutSizeRef.current = layoutSize;
  }, [layoutSize]);

  const appendPoint = useCallback(
    (x: number, y: number, start: boolean) => {
      const size = layoutSizeRef.current;
      const scale = size / canvasSize;

      setCurrentPath((prev) => {
        const logicalX = Math.max(0, Math.min(canvasSize, x / scale));
        const logicalY = Math.max(0, Math.min(canvasSize, y / scale));
        const next =
          start || !prev
            ? `M ${logicalX} ${logicalY}`
            : `${prev} L ${logicalX} ${logicalY}`;
        currentPathRef.current = next;
        return next;
      });
    },
    [canvasSize],
  );

  const commitStroke = useCallback(() => {
    const path = currentPathRef.current;
    if (!path) return;

    setStrokes((current) => [
      ...current,
      {
        d: path,
        color: activeColorRef.current,
        width: strokeWidthRef.current,
      },
    ]);
    setRedoStack([]);
    currentPathRef.current = null;
    setCurrentPath(null);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          appendPoint(locationX, locationY, true);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          appendPoint(locationX, locationY, false);
        },
        onPanResponderRelease: commitStroke,
        onPanResponderTerminate: commitStroke,
      }),
    [appendPoint, commitStroke],
  );

  const undo = () => {
    setStrokes((current) => {
      if (current.length === 0) return current;
      setRedoStack((redo) => [...redo, current[current.length - 1]]);
      return current.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((redo) => {
      if (redo.length === 0) return redo;
      setStrokes((current) => [...current, redo[redo.length - 1]]);
      return redo.slice(0, -1);
    });
  };

  const clear = () => {
    setStrokes([]);
    setRedoStack([]);
    currentPathRef.current = null;
    setCurrentPath(null);
  };

  const exportState = (): DrawCanvasState => ({
    strokes,
    backgroundColor,
    canvasSize,
  });

  const brushPalette = useMemo(
    () => visibleBrushColors(backgroundColor),
    [backgroundColor],
  );

  return (
    <Box style={{ gap: 12, flex: 1 }}>
      <View
        accessible
        accessibilityRole="none"
        accessibilityLabel={t("profile.draw.canvasLabel")}
        accessibilityHint={t("profile.draw.canvasHint")}
        collapsable={false}
        {...panResponder.panHandlers}
        style={{
          width: layoutSize,
          height: layoutSize,
          alignSelf: "center",
          borderRadius: maskShape === "circle" ? layoutSize / 2 : 12,
          overflow: "hidden",
        }}
      >
        <Svg
          pointerEvents="none"
          width={layoutSize}
          height={layoutSize}
          viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        >
          <Rect width={canvasSize} height={canvasSize} fill={backgroundColor} />
          {strokes.map((stroke, index) => (
            <Path
              key={`${index}-${stroke.d}`}
              d={stroke.d}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={activeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      <Box
        style={{
          flexDirection: "row",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {brushPalette.map((swatchColor) => {
          const selected = !erasing && brushColor === swatchColor;

          return (
            <Pressable
              key={swatchColor}
              accessibilityRole="button"
              accessibilityLabel={t("profile.draw.brushColorA11y", {
                color: swatchColor,
              })}
              accessibilityState={{ selected }}
              onPress={() => {
                setErasing(false);
                setBrushColor(swatchColor);
              }}
              style={{
                backgroundColor: swatchColor,
                borderRadius: 999,
                width: brushButtonSize,
                height: brushButtonSize,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.25)",
              }}
            />
          );
        })}
        <IconButton
          variant={erasing ? "solid" : "plain"}
          color="neutral"
          padding={6}
          accessibilityLabel={t("profile.draw.eraser")}
          onPress={() => setErasing(true)}
        >
          <EraserIcon size={16} />
        </IconButton>
        <IconButton
          variant="plain"
          color="neutral"
          padding={6}
          accessibilityLabel={t("profile.draw.brush")}
          onPress={() => setErasing(false)}
        >
          <PencilSimpleIcon size={16} />
        </IconButton>
      </Box>

      <Box style={{ gap: 4 }}>
        <Typography level="body-xs">
          {t("profile.draw.strokeWidth", { value: strokeWidth })}
        </Typography>
        <Slider
          size={18}
          min={1}
          max={24}
          step={1}
          value={strokeWidth}
          onChange={(value) =>
            setStrokeWidth(Array.isArray(value) ? value[0] : value)
          }
        />
      </Box>

      <Box style={{ gap: 4 }}>
        <Typography level="body-xs" weight={700}>
          {t("profile.draw.background")}
        </Typography>
        <InputColor
          value={backgroundColor as ColorLike}
          onChange={(next) => {
            const nextBackground = normalizeHexColor(String(next));
            setBackgroundColor(nextBackground);
            setBrushColor((current) =>
              brushContrastsWithBackground(current, nextBackground)
                ? current
                : getDefaultBrushColor(nextBackground),
            );
          }}
          fullWidth
        />
      </Box>

      <Box style={{ flexDirection: "row", gap: 8 }}>
        <IconButton
          variant="soft"
          color="neutral"
          accessibilityLabel={t("profile.draw.undo")}
          disabled={strokes.length === 0}
          onPress={undo}
        >
          <ArrowCounterClockwiseIcon size={16} />
        </IconButton>
        <IconButton
          variant="soft"
          color="neutral"
          accessibilityLabel={t("profile.draw.redo")}
          disabled={redoStack.length === 0}
          onPress={redo}
        >
          <ArrowClockwiseIcon size={16} />
        </IconButton>
        <IconButton
          variant="soft"
          color="danger"
          accessibilityLabel={t("profile.draw.clear")}
          disabled={strokes.length === 0}
          onPress={clear}
        >
          <TrashIcon size={16} />
        </IconButton>
      </Box>

      <Box style={{ flexDirection: "row", gap: 8, marginTop: "auto" }}>
        <Button color="neutral" disabled={disableActions} onPress={onCancel}>
          {tCommon("cancel")}
        </Button>
        {onSaveDraft && (
          <Button
            color="neutral"
            disabled={disableActions || strokes.length === 0}
            onPress={() => onSaveDraft(exportState())}
          >
            {resolvedSaveDraftLabel}
          </Button>
        )}
        <Button
          color="primary"
          disabled={disableActions || strokes.length === 0}
          onPress={() => onSave(exportState())}
        >
          {resolvedSaveLabel}
        </Button>
      </Box>
    </Box>
  );
}
