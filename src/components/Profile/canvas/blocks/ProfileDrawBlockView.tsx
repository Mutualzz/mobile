import type { ProfileDrawBlock } from "@mutualzz/types";
import { Paper } from "@mutualzz/ui-native";
import { PencilSimpleIcon } from "phosphor-react-native";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

export function ProfileDrawBlockView({ block }: { block: ProfileDrawBlock }) {
  if (!block.svgData) {
    return (
      <Paper
        elevation={1}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <PencilSimpleIcon size={32} style={{ opacity: 0.3 }} />
      </Paper>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: block.backgroundColor ?? "transparent",
      }}
    >
      <SvgXml xml={block.svgData} width="100%" height="100%" />
    </View>
  );
}
