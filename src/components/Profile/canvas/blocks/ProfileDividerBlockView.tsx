import type { ProfileDividerBlock } from "@mutualzz/types";
import { View } from "react-native";

export function ProfileDividerBlockView({
  block,
}: {
  block: ProfileDividerBlock;
}) {
  const style = block.style ?? "line";

  if (style === "space") {
    return <View style={{ width: "100%", height: "100%" }} />;
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
      <View
        style={{
          width: "100%",
          height: style === "dotted" ? 1 : 2,
          borderRadius: 999,
          borderTopWidth: style === "dotted" ? 2 : 0,
          borderStyle: style === "dotted" ? "dotted" : "solid",
          borderTopColor: "rgba(128,128,128,0.35)",
          backgroundColor:
            style === "line" ? "rgba(128,128,128,0.28)" : undefined,
        }}
      />
    </View>
  );
}
