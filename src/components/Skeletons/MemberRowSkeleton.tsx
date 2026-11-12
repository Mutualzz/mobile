import { Skeleton } from "@mutualzz/ui-native";
import { View } from "react-native";
import { pickNameWidth } from "./SkeletonGroup";

export const MemberRowSkeleton = ({ index = 0 }: { index?: number }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 8,
    }}
  >
    <Skeleton variant="circular" size={36} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Skeleton width={pickNameWidth(index)} fontSize={14} />
      {index % 3 === 1 && (
        <Skeleton width={pickNameWidth(index, 2) - 16} fontSize={11} />
      )}
    </View>
  </View>
);
