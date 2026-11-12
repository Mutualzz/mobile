import { Paper } from "@components/Paper";
import { Skeleton } from "@mutualzz/ui-native";
import { View } from "react-native";
import { pickTextWidth, SkeletonGroup } from "./SkeletonGroup";

export type ListRowSkeletonLeading = "avatar" | "icon" | "none";

interface ListRowSkeletonProps {
  index?: number;
  leading?: ListRowSkeletonLeading;
  lines?: number;
  action?: boolean;
}

export const ListRowSkeleton = ({
  index = 0,
  leading = "none",
  lines = 2,
  action = false,
}: ListRowSkeletonProps) => (
  <Paper
    variant="soft"
    style={{
      borderRadius: 10,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    }}
  >
    {leading === "avatar" && <Skeleton variant="circular" size={36} />}
    {leading === "icon" && <Skeleton variant="rounded" size={36} />}
    <View style={{ flex: 1, minWidth: 0 }}>
      {Array.from({ length: lines }, (_line, lineIndex) => (
        <Skeleton
          key={lineIndex}
          width={lineIndex === 0 ? "45%" : pickTextWidth(index, lineIndex)}
          fontSize={lineIndex === 0 ? 15 : 13}
        />
      ))}
    </View>
    {action && <Skeleton variant="rounded" width={72} height={30} />}
  </Paper>
);

export const ListSkeleton = ({
  label,
  count = 4,
  ...rowProps
}: Omit<ListRowSkeletonProps, "index"> & {
  label: string;
  count?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={count}
    gap={8}
    render={(index) => <ListRowSkeleton index={index} {...rowProps} />}
  />
);
