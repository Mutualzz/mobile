import type { ProfileBlockSize, ProfileBlockType } from "@mutualzz/types";
import { Paper } from "@mutualzz/ui-native";
import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { getWidgetTileHeight } from "./profileWidget.constants";

interface Props {
  type: ProfileBlockType;
  size: ProfileBlockSize;
  onMaximize?: () => void;
  children: ReactNode;
}

export function ProfileWidgetTile({ type, size, onMaximize, children }: Props) {
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
    </Paper>
  );

  if (!onMaximize) return content;

  return (
    <Pressable onPress={onMaximize} style={{ width: "100%" }}>
      {content}
    </Pressable>
  );
}
