import type { APIMessage } from "@mutualzz/types";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";

export interface MentionsPage {
  messages: APIMessage[];
  hasMore: boolean;
  nextBefore: string | null;
}

export type MentionsData = InfiniteData<MentionsPage, string | undefined>;

export type MentionKind = "user" | "role" | "everyone";

export const MENTIONS_QUERY_ROOT = "mentions";

export const mentionsQueryKey = (
  includeEveryone: boolean,
  includeRoles: boolean,
  spaceId: string | undefined,
) => [MENTIONS_QUERY_ROOT, includeEveryone, includeRoles, spaceId ?? "all"];

export const removeMentionFromCache = (
  data: MentionsData | undefined,
  messageId: string,
): MentionsData | undefined =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.filter((message) => message.id !== messageId),
    })),
  };

export const removeMentionFromCaches = (
  queryClient: QueryClient,
  messageId: string,
) =>
  queryClient.setQueriesData<MentionsData>(
    { queryKey: [MENTIONS_QUERY_ROOT] },
    (current) => removeMentionFromCache(current, messageId),
  );

export const insertMentionIntoCaches = (
  queryClient: QueryClient,
  message: APIMessage,
  kind: MentionKind,
  spaceId: string | null,
) => {
  const cached = queryClient.getQueriesData<MentionsData>({
    queryKey: [MENTIONS_QUERY_ROOT],
  });

  for (const [queryKey, data] of cached) {
    if (!data || data.pages.length === 0) continue;

    const [, includeEveryone, includeRoles, spaceFilter] = queryKey;
    if (kind === "everyone" && !includeEveryone) continue;
    if (kind === "role" && !includeRoles) continue;
    if (spaceFilter !== "all" && spaceFilter !== spaceId) continue;

    const alreadyListed = data.pages.some((page) =>
      page.messages.some((existing) => existing.id === message.id),
    );
    if (alreadyListed) continue;

    queryClient.setQueryData<MentionsData>(queryKey, {
      ...data,
      pages: data.pages.map((page, index) =>
        index === 0 ? { ...page, messages: [message, ...page.messages] } : page,
      ),
    });
  }
};

export const clearMentionCaches = (queryClient: QueryClient) =>
  queryClient.setQueriesData<MentionsData>(
    { queryKey: [MENTIONS_QUERY_ROOT] },
    (current) =>
      current && {
        pages: [{ messages: [], hasMore: false, nextBefore: null }],
        pageParams: [undefined],
      },
  );
