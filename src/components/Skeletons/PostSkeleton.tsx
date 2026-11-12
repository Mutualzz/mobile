import { Paper } from "@components/Paper";
import { FEED_COLUMN_MAX_WIDTH } from "@utils/feedLayout";
import { Skeleton } from "@mutualzz/ui-native";
import { View } from "react-native";
import { pickNameWidth, pickTextWidth, SkeletonGroup } from "./SkeletonGroup";

const PostHeaderSkeleton = ({ index }: { index: number }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
    <Skeleton variant="circular" size={40} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Skeleton width={pickNameWidth(index)} fontSize={15} />
      <Skeleton width={72} fontSize={11} />
    </View>
  </View>
);

export const PostCardSkeleton = ({ index = 0 }: { index?: number }) => {
  const hasMedia = index % 2 === 1;

  return (
    <Paper
      style={{
        width: "100%",
        maxWidth: FEED_COLUMN_MAX_WIDTH,
        alignSelf: "center",
        borderRadius: 12,
        overflow: "hidden",
        padding: 12,
        gap: 10,
      }}
    >
      <PostHeaderSkeleton index={index} />
      <View>
        <Skeleton width={pickTextWidth(index, 6)} fontSize={15} />
        <Skeleton width={pickTextWidth(index, 2)} fontSize={15} />
        {!hasMedia && (
          <Skeleton width={pickTextWidth(index, 3)} fontSize={15} />
        )}
      </View>
      {hasMedia && <Skeleton variant="rounded" height={220} />}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Skeleton variant="rounded" width={56} height={28} />
        <Skeleton variant="rounded" width={56} height={28} />
        <Skeleton variant="rounded" width={40} height={28} />
      </View>
    </Paper>
  );
};

export const PostListSkeleton = ({
  label,
  count = 3,
}: {
  label: string;
  count?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={count}
    render={(index) => <PostCardSkeleton index={index} />}
  />
);

export const PostEmbedSkeleton = () => (
  <View style={{ gap: 8 }}>
    <PostHeaderSkeleton index={0} />
    <View>
      <Skeleton width="90%" fontSize={14} />
      <Skeleton width="60%" fontSize={14} />
    </View>
  </View>
);

export const CommentSkeleton = ({ index = 0 }: { index?: number }) => (
  <View style={{ flexDirection: "row", gap: 10 }}>
    <Skeleton variant="circular" size={32} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Skeleton width={pickNameWidth(index, 1)} fontSize={14} />
      <Skeleton width={pickTextWidth(index)} fontSize={14} />
      {index % 2 === 0 && (
        <Skeleton width={pickTextWidth(index, 4)} fontSize={14} />
      )}
    </View>
  </View>
);

export const CommentListSkeleton = ({
  label,
  count = 3,
}: {
  label: string;
  count?: number;
}) => (
  <SkeletonGroup
    label={label}
    count={count}
    gap={16}
    render={(index) => <CommentSkeleton index={index} />}
  />
);
