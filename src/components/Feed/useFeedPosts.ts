import type { Post } from "@stores/objects/Post";
import { useAppStore } from "@hooks/useStores";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const LIMIT = 25;

export type FeedVariant = "friends" | "for-you" | "saved";

export function useFeedPosts(variant: FeedVariant) {
  const app = useAppStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ["posts", variant],
      initialPageParam: variant === "for-you" ? 1 : undefined,
      queryFn: async ({ pageParam }: { pageParam?: number | string }) => {
        if (variant === "for-you") {
          const posts = await app.posts.getForYouFeed({
            page: (pageParam as number) ?? 1,
            limit: LIMIT,
          });

          return {
            ids: posts.map((post) => post.id),
            nextPage: ((pageParam as number) ?? 1) + 1,
            count: posts.length,
          };
        }

        const posts =
          variant === "saved"
            ? await app.posts.getSavedFeed({
                before: pageParam as string | undefined,
                limit: LIMIT,
              })
            : await app.posts.getFriendsFeed({
                before: pageParam as string | undefined,
                limit: LIMIT,
              });

        return {
          ids: posts.map((post) => post.id),
          nextCursor: posts[posts.length - 1]?.id,
          count: posts.length,
        };
      },
      getNextPageParam: (lastPage) => {
        if (!lastPage.count || lastPage.count < LIMIT) return undefined;
        return variant === "for-you" ? lastPage.nextPage : lastPage.nextCursor;
      },
    });

  const ids = useMemo(
    () => data?.pages.flatMap((page) => page.ids) ?? [],
    [data],
  );

  const posts = useMemo(
    () =>
      ids.map((id) => app.posts.get(id)).filter((post): post is Post => !!post),
    [app.posts, ids],
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    posts,
    fetchMore,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  };
}
