import { Paper } from "@components/Paper";
import { Skeleton, useTheme } from "@mutualzz/ui-native";
import { View } from "react-native";
import { pickTextWidth, SkeletonGroup } from "./SkeletonGroup";

export const InboxCardSkeleton = ({ index = 0 }: { index?: number }) => {
  const { theme } = useTheme();

  return (
    <Paper
      elevation={1}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: `${theme.colors.neutral}40`,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 12,
        }}
      >
        <Skeleton variant="circular" size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="45%" fontSize={14} />
          <Skeleton width="25%" fontSize={12} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <Skeleton width={pickTextWidth(index)} fontSize={14} />
        {index % 2 === 0 && (
          <Skeleton width={pickTextWidth(index, 1)} fontSize={14} />
        )}
      </View>
    </Paper>
  );
};

export const InboxListSkeleton = ({
  label,
  count = 4,
}: {
  label: string;
  count?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={count}
    render={(index) => <InboxCardSkeleton index={index} />}
  />
);

export const NotificationRowSkeleton = ({ index = 0 }: { index?: number }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 4,
      paddingVertical: 6,
    }}
  >
    <Skeleton variant="circular" size={32} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Skeleton width={pickTextWidth(index, 2)} fontSize={14} />
      <Skeleton width={48} fontSize={11} />
    </View>
  </View>
);

export const NotificationListSkeleton = ({
  label,
  count = 5,
}: {
  label: string;
  count?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={count}
    gap={2}
    render={(index) => <NotificationRowSkeleton index={index} />}
  />
);
