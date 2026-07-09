import { useAppStore } from "@hooks/useStores";
import type { Snowflake } from "@mutualzz/types";
import { useMutation } from "@tanstack/react-query";

interface Options {
  onComplete?: () => void;
}

export function useUserRelationshipActions(
  userId: Snowflake,
  { onComplete }: Options = {},
) {
  const app = useAppStore();
  const meId = app.account?.id;
  const relationship = app.relationships.getForMe(userId);

  const isFriend = relationship?.isFriend ?? false;
  const isIncomingRequest = relationship?.isIncomingRequest ?? false;
  const isOutgoingRequest = relationship?.isOutgoingRequest ?? false;
  const isBlocked = relationship?.isBlocked ?? false;
  const iBlockedThem = isBlocked && relationship?.userId === meId;

  const addFriend = useMutation({
    mutationKey: ["add-friend", userId],
    mutationFn: () => app.relationships.sendFriendRequest(userId),
    onSuccess: (rel) => {
      if (rel) app.relationships.update(rel);
      onComplete?.();
    },
  });

  const acceptFriend = useMutation({
    mutationKey: ["accept-friend", userId],
    mutationFn: () => app.relationships.acceptFriendRequest(userId),
    onSuccess: (rel) => {
      if (rel) app.relationships.update(rel);
      onComplete?.();
    },
  });

  const declineFriend = useMutation({
    mutationKey: ["decline-friend", userId],
    mutationFn: () => app.relationships.declineFriendRequest(userId),
    onSuccess: () => {
      if (meId) app.relationships.remove(meId, userId);
      onComplete?.();
    },
  });

  const removeFriend = useMutation({
    mutationKey: ["remove-friend", userId],
    mutationFn: () => app.relationships.removeFriend(userId),
    onSuccess: () => {
      if (meId) app.relationships.remove(meId, userId);
      onComplete?.();
    },
  });

  const blockUser = useMutation({
    mutationKey: ["block-user", userId],
    mutationFn: () => app.relationships.blockUser(userId),
    onSuccess: (rel) => {
      if (rel) app.relationships.update(rel);
      onComplete?.();
    },
  });

  const unblockUser = useMutation({
    mutationKey: ["unblock-user", userId],
    mutationFn: () => app.relationships.unblockUser(userId),
    onSuccess: () => {
      if (meId) app.relationships.remove(meId, userId);
      onComplete?.();
    },
  });

  const relationshipPending =
    addFriend.isPending ||
    acceptFriend.isPending ||
    declineFriend.isPending ||
    removeFriend.isPending ||
    blockUser.isPending ||
    unblockUser.isPending;

  return {
    isFriend,
    isIncomingRequest,
    isOutgoingRequest,
    iBlockedThem,
    relationshipPending,
    addFriend,
    acceptFriend,
    declineFriend,
    removeFriend,
    blockUser,
    unblockUser,
  };
}
