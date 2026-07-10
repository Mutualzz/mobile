import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

interface Props {
  uri: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: "cover" | "contain";
}

export function ProfileBlockLoopingVideo({
  uri,
  style,
  contentFit = "cover",
}: Props) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    player.play();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={[styles.video, style]}
      contentFit={contentFit}
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: "100%",
  },
});
