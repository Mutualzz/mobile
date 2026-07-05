import type { MobileProfileDrawBlock } from "@mutualzz/types";
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
        }}
      >
        <PencilSimpleIcon size={28} style={{ opacity: 0.3 }} />
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
