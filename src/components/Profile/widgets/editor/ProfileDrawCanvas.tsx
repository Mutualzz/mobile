import { Button } from "@components/Button";
import type { ColorLike } from "@mutualzz/ui-core";
import {
  Box,
  IconButton,
  InputColor,
  Slider,
  Typography,
} from "@mutualzz/ui-native";
import {
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  EraserIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "phosphor-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path, Rect } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

export interface DrawStroke {
  d: string;
  color: string;
  width: number;
}

export interface DrawCanvasState {
  strokes: DrawStroke[];
  backgroundColor: string;
}

const CANVAS_SIZE = 320;
const DEFAULT_BACKGROUND = "#1a1a2e";

export function renderStrokesToSvg(state: DrawCanvasState): string {
  const paths = state.strokes
    .map(
      (s) =>
        `<path d="${s.d}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join("");

  return `<svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg"><rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${state.backgroundColor}" />${paths}</svg>`;
}

interface Props {
  initial: DrawCanvasState | null;
  onCancel: () => void;
  onSave: (state: DrawCanvasState) => void;
}

const BRUSH_COLORS = [
  "#ffffff",
  "#f4f4f5",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
];

export function ProfileDrawCanvas({ initial, onCancel, onSave }: Props) {
  const [strokes, setStrokes] = useState<DrawStroke[]>(initial?.strokes ?? []);
  const [redoStack, setRedoStack] = useState<DrawStroke[]>([]);
  const [backgroundColor, setBackgroundColor] = useState(
    initial?.backgroundColor ?? DEFAULT_BACKGROUND,
  );
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [erasing, setErasing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  const activeColor = erasing ? backgroundColor : brushColor;

  const appendPoint = (x: number, y: number, start: boolean) => {
    setCurrentPath((prev) => {
      const clampedX = Math.max(0, Math.min(CANVAS_SIZE, x));
      const clampedY = Math.max(0, Math.min(CANVAS_SIZE, y));
      if (start || !prev) return `M ${clampedX} ${clampedY}`;
      return `${prev} L ${clampedX} ${clampedY}`;
    });
  };

  const commitStroke = () => {
    setCurrentPath((prev) => {
      if (prev) {
        setStrokes((s) => [
          ...s,
          { d: prev, color: activeColor, width: strokeWidth },
        ]);
        setRedoStack([]);
      }
      return null;
    });
  };

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      scheduleOnRN(appendPoint, e.x, e.y, true);
    })
    .onUpdate((e) => {
      scheduleOnRN(appendPoint, e.x, e.y, false);
    })
    .onEnd(() => {
      scheduleOnRN(commitStroke);
    });

  const undo = () => {
    setStrokes((s) => {
      if (s.length === 0) return s;
      setRedoStack((r) => [...r, s[s.length - 1]]);
      return s.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      setStrokes((s) => [...s, r[r.length - 1]]);
      return r.slice(0, -1);
    });
  };

  const clear = () => {
    setStrokes([]);
    setRedoStack([]);
  };

  return (
    <Box style={{ gap: 12 }}>
      <GestureDetector gesture={panGesture}>
        <View
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            alignSelf: "center",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Svg
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          >
            <Rect
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              fill={backgroundColor}
            />
            {strokes.map((s, i) => (
              <Path
                key={i}
                d={s.d}
                stroke={s.color}
                strokeWidth={s.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke={activeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>
      </GestureDetector>

      <Box
        style={{
          flexDirection: "row",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {BRUSH_COLORS.map((color) => (
          <IconButton
            key={color}
            variant={!erasing && brushColor === color ? "solid" : "plain"}
            color="neutral"
            padding={4}
            accessibilityLabel={`Brush color ${color}`}
            onPress={() => {
              setErasing(false);
              setBrushColor(color);
            }}
            style={{
              backgroundColor: color,
              borderRadius: 999,
              width: 28,
              height: 28,
            }}
          >
            <></>
          </IconButton>
        ))}
        <IconButton
          variant={erasing ? "solid" : "plain"}
          color="neutral"
          padding={6}
          accessibilityLabel="Eraser"
          onPress={() => setErasing(true)}
        >
          <EraserIcon size={16} />
        </IconButton>
        <IconButton
          variant="plain"
          color="neutral"
          padding={6}
          accessibilityLabel="Brush"
          onPress={() => setErasing(false)}
        >
          <PencilSimpleIcon size={16} />
        </IconButton>
      </Box>

      <Box style={{ gap: 4 }}>
        <Typography level="body-xs">Stroke width ({strokeWidth}px)</Typography>
        <Slider
          min={1}
          max={24}
          step={1}
          value={strokeWidth}
          onChange={(v) => setStrokeWidth(v as number)}
        />
      </Box>

      <Box style={{ gap: 4 }}>
        <Typography level="body-xs" weight={700}>
          Background
        </Typography>
        <InputColor
          value={backgroundColor as ColorLike}
          onChange={(next) => setBackgroundColor(next)}
          fullWidth
        />
      </Box>

      <Box style={{ flexDirection: "row", gap: 8 }}>
        <IconButton
          variant="soft"
          color="neutral"
          accessibilityLabel="Undo"
          disabled={strokes.length === 0}
          onPress={undo}
        >
          <ArrowCounterClockwiseIcon size={16} />
        </IconButton>
        <IconButton
          variant="soft"
          color="neutral"
          accessibilityLabel="Redo"
          disabled={redoStack.length === 0}
          onPress={redo}
        >
          <ArrowClockwiseIcon size={16} />
        </IconButton>
        <IconButton
          variant="soft"
          color="danger"
          accessibilityLabel="Clear"
          disabled={strokes.length === 0}
          onPress={clear}
        >
          <TrashIcon size={16} />
        </IconButton>
      </Box>

      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Button color="neutral" style={{ flex: 1 }} onPress={onCancel}>
          Cancel
        </Button>
        <Button
          color="primary"
          style={{ flex: 1 }}
          onPress={() => onSave({ strokes, backgroundColor })}
        >
          Save Drawing
        </Button>
      </Box>
    </Box>
  );
}
