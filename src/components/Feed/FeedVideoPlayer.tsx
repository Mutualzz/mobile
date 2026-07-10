import { useVideoPlayer, VideoView } from "expo-video";
import { PlayIcon } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  uri: string;
  isActive: boolean;
  muted?: boolean;
}

export function FeedVideoPlayer({ uri, isActive, muted = true }: Props) {
  const [userPaused, setUserPaused] = useState(false);
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = muted;
  });

  useEffect(() => {
    if (isActive) {
      setUserPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      player.pause();
      return;
    }

    if (userPaused) {
      player.pause();
      return;
    }

    player.play();
  }, [isActive, userPaused, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const showPlayOverlay = isActive && userPaused;

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        if (!isActive) return;
        setUserPaused((paused) => !paused);
      }}
      accessibilityRole="button"
      accessibilityLabel={userPaused ? "Play video" : "Pause video"}
    >
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {showPlayOverlay && (
        <View style={styles.playOverlay} pointerEvents="none">
          <PlayIcon size={56} color="#fff" weight="fill" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
