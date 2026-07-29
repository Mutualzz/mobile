import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { type PropsWithChildren, useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

type Props = PropsWithChildren<{
  spoiler?: boolean;
  width?: number;
  height?: number;
  borderRadius?: number;
  maxWidth?: number;
  style?: ViewStyle;
}>;

export const MessageEmbedSpoiler = ({
  spoiler,
  children,
  width,
  height,
  borderRadius = 8,
  maxWidth,
  style,
}: Props) => {
  const app = useAppStore();
  const revealAll = app.settings?.revealAllSpoilers ?? false;
  const [revealed, setRevealed] = useState(revealAll);

  if (!spoiler) return <>{children}</>;

  const frameStyle: ViewStyle = {
    alignSelf: "flex-start",
    borderRadius,
    overflow: "hidden",
  };
  if (width != undefined) frameStyle.width = width;
  if (maxWidth != undefined) frameStyle.maxWidth = maxWidth;
  if (height != undefined) frameStyle.height = height;

  return (
    <Pressable
      onPress={() => setRevealed(true)}
      disabled={revealed}
      style={[frameStyle, style]}
    >
      <Paper
        elevation={revealed ? 0 : app.settings?.preferEmbossed ? 4 : 2}
        style={{
          width: "100%",
          height: "100%",
          borderRadius,
          overflow: "hidden",
          opacity: revealed ? 1 : 0.15,
        }}
      >
        <View
          pointerEvents={revealed ? "auto" : "none"}
          style={{ opacity: revealed ? 1 : 0 }}
        >
          {children}
        </View>
      </Paper>
      {!revealed && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius,
            backgroundColor: "rgba(127,127,127,0.85)",
          }}
        />
      )}
    </Pressable>
  );
};
