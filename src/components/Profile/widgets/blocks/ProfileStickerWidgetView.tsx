import type { MobileProfileStickerBlock } from "@mutualzz/types";
import { ImageFormat, type Sizes } from "@mutualzz/types";
import { Typography } from "@mutualzz/ui-native";
import { useAppStore } from "@hooks/useStores";
import { Expression } from "@stores/objects/Expression";
import { Image } from "expo-image";
import { StickerIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { View } from "react-native";

const STICKER_RENDER_SIZE = 256 satisfies Sizes;

function getStickerRenderUrl(sticker: Expression) {
  return Expression.constructUrl(
    sticker.id,
    sticker.animated,
    sticker.assetHash,
    STICKER_RENDER_SIZE,
    sticker.animated ? ImageFormat.GIF : ImageFormat.WebP,
  );
}

interface Props {
  block: MobileProfileStickerBlock;
}

export const ProfileStickerWidgetView = observer(({ block }: Props) => {
  const app = useAppStore();
  const [sticker, setSticker] = useState<Expression | null>(null);
  const expressionId = block.expressionId?.trim() ?? "";

  useEffect(() => {
    if (!expressionId) {
      setSticker(null);
      return;
    }

    const cached = app.expressions.get(expressionId);
    if (cached) {
      setSticker(cached);
      return;
    }

    let cancelled = false;
    void app.expressions.resolve(expressionId).then((resolved) => {
      if (!cancelled) setSticker(resolved ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [app.expressions, expressionId]);

  if (sticker) {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={{ uri: getStickerRenderUrl(sticker) }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          accessibilityLabel={sticker.name}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ alignItems: "center", gap: 6, opacity: 0.45, padding: 12 }}>
        <StickerIcon size={28} />
        <Typography level="body-xs" textColor="muted">
          {expressionId ? "Sticker unavailable" : "Choose a sticker"}
        </Typography>
      </View>
    </View>
  );
});

export function ProfileStickerWidgetExpandedContent({
  block,
}: {
  block: MobileProfileStickerBlock;
}) {
  return <ProfileStickerWidgetView block={block} />;
}
