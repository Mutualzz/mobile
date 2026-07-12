import { minecraftAvatarUrl } from "@utils/minecraft";
import { Box, useTheme } from "@mutualzz/ui-native";
import { CubeIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image } from "react-native";

interface Props {
  uuid?: string | null;
  name?: string;
  size?: number | "sm" | "md" | "lg";
}

const resolvePixelSize = (size: Props["size"]) => {
  if (typeof size === "number") return size;
  switch (size) {
    case "sm":
      return 24;
    case "lg":
      return 48;
    case "md":
    default:
      return 40;
  }
};

export const MinecraftAvatar = observer(
  ({ uuid, name, size = "md" }: Props) => {
    const { theme } = useTheme();
    const [failed, setFailed] = useState(false);
    const pixelSize = resolvePixelSize(size);

    if (!uuid || failed) {
      return (
        <Box
          style={{
            width: pixelSize,
            height: pixelSize,
            borderRadius: pixelSize / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(128,128,128,0.25)",
          }}
          accessibilityLabel={name ? `${name}'s Minecraft skin` : "Minecraft"}
        >
          <CubeIcon
            weight="fill"
            size={Math.round(pixelSize * 0.55)}
            color={theme.typography.colors.muted}
          />
        </Box>
      );
    }

    return (
      <Image
        source={{ uri: minecraftAvatarUrl(uuid) }}
        style={{
          width: pixelSize,
          height: pixelSize,
          borderRadius: pixelSize / 2,
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
        resizeMode="contain"
        onError={() => setFailed(true)}
        accessibilityLabel={name ? `${name}'s Minecraft skin` : "Minecraft skin"}
      />
    );
  },
);
