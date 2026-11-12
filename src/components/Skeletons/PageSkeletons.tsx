import { Skeleton, useTheme } from "@mutualzz/ui-native";
import { View } from "react-native";
import { SkeletonGroup } from "./SkeletonGroup";

const TILE_HEIGHTS = [100, 140, 120, 90, 130, 110, 95, 125];

export const TileGridSkeleton = ({
  label,
  count = 8,
  columns = 2,
  gap = 6,
}: {
  label: string;
  count?: number;
  columns?: number;
  gap?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={1}
    render={() => (
      <View style={{ flexDirection: "row", gap }}>
        {Array.from({ length: columns }, (_column, columnIndex) => (
          <View key={columnIndex} style={{ flex: 1, gap }}>
            {Array.from(
              { length: Math.ceil(count / columns) },
              (_tile, rowIndex) => (
                <Skeleton
                  key={rowIndex}
                  variant="rounded"
                  height={
                    TILE_HEIGHTS[
                      (rowIndex * columns + columnIndex) % TILE_HEIGHTS.length
                    ]
                  }
                />
              ),
            )}
          </View>
        ))}
      </View>
    )}
  />
);

export const ProfilePageSkeleton = ({ label }: { label: string }) => {
  const { theme } = useTheme();

  return (
    <SkeletonGroup
      label={label}
      count={1}
      style={{ padding: 16 }}
      render={() => (
        <View>
          <Skeleton
            variant="rounded"
            height={150}
            style={{ borderRadius: 16 }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 12,
              paddingHorizontal: 16,
              marginTop: -40,
            }}
          >
            <Skeleton
              variant="circular"
              size={88}
              style={{ borderWidth: 5, borderColor: theme.colors.background }}
            />
            <View style={{ flex: 1, minWidth: 0, paddingBottom: 6 }}>
              <Skeleton width="60%" fontSize={22} />
              <Skeleton width="35%" fontSize={14} />
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Skeleton variant="rounded" width="47%" height={150} />
            <Skeleton variant="rounded" width="47%" height={150} />
            <Skeleton variant="rounded" width="100%" height={110} />
          </View>
        </View>
      )}
    />
  );
};

export const InviteCardSkeleton = ({ label }: { label: string }) => (
  <SkeletonGroup
    label={label}
    count={1}
    style={{ alignItems: "center" }}
    render={() => (
      <View style={{ alignItems: "center", gap: 10, width: "100%" }}>
        <Skeleton variant="rounded" size={56} style={{ borderRadius: 16 }} />
        <Skeleton width={200} fontSize={14} />
        <Skeleton width={160} fontSize={24} />
        <Skeleton
          variant="rounded"
          width="100%"
          height={44}
          style={{ marginTop: 8 }}
        />
      </View>
    )}
  />
);

export const StaffUserSkeleton = ({ label }: { label: string }) => (
  <SkeletonGroup
    label={label}
    count={1}
    style={{ padding: 16 }}
    render={() => (
      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Skeleton variant="circular" size={64} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="50%" fontSize={20} />
            <Skeleton width="30%" fontSize={13} />
          </View>
        </View>
        {Array.from({ length: 4 }, (_card, index) => (
          <Skeleton key={index} variant="rounded" height={72} />
        ))}
      </View>
    )}
  />
);
