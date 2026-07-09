import type { MobileProfileDrawBlock } from "@mutualzz/types";
import { Typography } from "@mutualzz/ui-native";
import { PencilSimpleIcon } from "phosphor-react-native";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

interface Props {
  block: MobileProfileDrawBlock;
}

export function ProfileDrawWidgetView({ block }: Props) {
  if (!block.svgData) {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: 12,
        }}
      >
        <PencilSimpleIcon size={28} color="rgba(128,128,128,0.45)" />
        <Typography level="body-xs" textColor="muted" style={{ textAlign: "center" }}>
          No drawing yet
        </Typography>
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: block.backgroundColor ?? "transparent",
      }}
    >
      <SvgXml xml={block.svgData} width="100%" height="100%" />
    </View>
  );
}

export function ProfileDrawWidgetExpandedContent({ block }: Props) {
  if (!block.svgData) return null;

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 1,
        backgroundColor: block.backgroundColor ?? "transparent",
      }}
    >
      <SvgXml xml={block.svgData} width="100%" height="100%" />
    </View>
  );
}
