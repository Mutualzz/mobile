import { itemName } from "@mutualzz/client";
import { Typography } from "@mutualzz/ui-native";
import { useState } from "react";
import { Image } from "react-native";

const TEXTURE_BASE =
  "https://assets.mcasset.cloud/26.1.2/assets/minecraft/textures";

export const ItemIcon = ({ type, size }: { type: string; size: number }) => {
  const itemId = type.replace(/^minecraft:/, "");
  const sources = [
    `${TEXTURE_BASE}/item/${itemId}.png`,
    `${TEXTURE_BASE}/block/${itemId}.png`,
  ];
  const [attempt, setAttempt] = useState(0);

  if (attempt >= sources.length) {
    return (
      <Typography
        level="body-xs"
        numberOfLines={2}
        style={{ textAlign: "center", fontSize: 9, lineHeight: 10 }}
      >
        {itemName(type)}
      </Typography>
    );
  }

  return (
    <Image
      source={{ uri: sources[attempt] }}
      accessibilityLabel={itemName(type)}
      onError={() => setAttempt((current) => current + 1)}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};
