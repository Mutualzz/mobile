import type { DrawCanvasState } from "./ProfileDrawCanvas";

export const PROFILE_DRAW_CANVAS_SIZE = 320;
export const AVATAR_DRAW_CANVAS_SIZE = 512;

export function getDrawCanvasSize(state: DrawCanvasState) {
  return state.canvasSize ?? PROFILE_DRAW_CANVAS_SIZE;
}
