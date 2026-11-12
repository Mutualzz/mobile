import { Skeleton } from "@mutualzz/ui-native";
import { View } from "react-native";
import { pickNameWidth, pickTextWidth, SkeletonGroup } from "./SkeletonGroup";

export const MessageGroupSkeleton = ({ index = 0 }: { index?: number }) => {
  const lineCount = (index % 3) + 1;
  const hasMedia = index % 5 === 3;

  return (
    <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 12 }}>
      <Skeleton variant="circular" size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Skeleton width={pickNameWidth(index)} fontSize={15} />
          <Skeleton width={48} fontSize={11} />
        </View>
        {Array.from({ length: lineCount }, (_line, lineIndex) => (
          <Skeleton
            key={lineIndex}
            width={pickTextWidth(index, lineIndex)}
            fontSize={15}
          />
        ))}
        {hasMedia && (
          <Skeleton
            variant="rounded"
            width="80%"
            height={160}
            style={{ marginTop: 6 }}
          />
        )}
      </View>
    </View>
  );
};

export const MessageListSkeleton = ({
  label,
  count = 6,
}: {
  label: string;
  count?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={count}
    gap={18}
    style={{ paddingVertical: 12 }}
    render={(index) => <MessageGroupSkeleton index={index} />}
  />
);
