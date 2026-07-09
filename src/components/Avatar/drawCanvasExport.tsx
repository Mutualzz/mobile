import type { DrawCanvasState } from "@components/Profile/widgets/editor/ProfileDrawCanvas";
import { getDrawCanvasSize } from "@components/Profile/widgets/editor/drawCanvas.constants";
import { formatColor, handleColor } from "@mutualzz/ui-core";
import {
  Group,
  ImageFormat,
  Path,
  Rect,
  Skia,
  drawAsImage,
} from "@shopify/react-native-skia";

function normalizeSkiaColor(color: string) {
  try {
    return formatColor(handleColor(color).hex);
  } catch {
    return "#000000";
  }
}

function circleClipPath(size: number) {
  const path = Skia.Path.Make();
  path.addCircle(size / 2, size / 2, size / 2);
  return path;
}

function DrawScene({
  state,
  circular,
}: {
  state: DrawCanvasState;
  circular: boolean;
}) {
  const size = getDrawCanvasSize(state);
  const background = normalizeSkiaColor(state.backgroundColor);
  const content = (
    <>
      <Rect x={0} y={0} width={size} height={size} color={background} />
      {state.strokes.map((stroke, index) => {
        const path = Skia.Path.MakeFromSVGString(stroke.d);
        if (!path) return null;

        return (
          <Path
            key={`${index}-${stroke.d}`}
            path={path}
            color={normalizeSkiaColor(stroke.color)}
            style="stroke"
            strokeWidth={stroke.width}
            strokeCap="round"
            strokeJoin="round"
          />
        );
      })}
    </>
  );

  if (!circular) return content;

  return <Group clip={circleClipPath(size)}>{content}</Group>;
}

export async function exportDrawCanvasToBase64(
  state: DrawCanvasState,
  options?: { circular?: boolean },
): Promise<string | null> {
  const size = getDrawCanvasSize(state);

  try {
    const image = await drawAsImage(
      <DrawScene state={state} circular={options?.circular ?? false} />,
      { width: size, height: size },
    );

    if (!image) return null;
    return image.encodeToBase64(ImageFormat.PNG, 100);
  } catch {
    return null;
  }
}

export function drawCanvasPngDataUri(base64: string) {
  return `data:image/png;base64,${base64}`;
}
