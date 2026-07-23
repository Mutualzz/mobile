import { PostActions } from "@components/Feed/PostActions";
import { SharePostSheet } from "@components/Feed/SharePostSheet";
import type { Post } from "@stores/objects/Post";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  post: Post;
  commentsActive?: boolean;
  onOpenComments?: () => void;
}

export const PostFeedActions = observer(
  ({ post, commentsActive, onOpenComments }: Props) => {
    const [shareOpen, setShareOpen] = useState(false);

    return (
      <>
        <PostActions
          liked={post.liked}
          saved={post.saved}
          shared={post.shared}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          shareCount={post.shareCount}
          commentsOpen={commentsActive}
          onLike={() => void post.toggleLike()}
          onComment={() => onOpenComments?.()}
          onShare={() => setShareOpen(true)}
          onSave={() => void post.toggleSave()}
        />

        <SharePostSheet
          visible={shareOpen}
          post={post}
          onClose={() => setShareOpen(false)}
        />
      </>
    );
  },
);
