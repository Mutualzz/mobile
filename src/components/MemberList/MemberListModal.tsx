import { ListSection } from "@components/ListSection";
import { MemberListItem } from "@components/MemberList/MemberListItem";
import { Screen, ScreenHeader } from "@components/Screen/Screen";
import { IconButton } from "@components/IconButton";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { XIcon } from "phosphor-react-native";
import type { Channel } from "@stores/objects/Channel";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "react";
import {
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
} from "react-native";

const PAGE_SIZE = 50;

interface Props {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
}

export const MemberListModal = observer(
  ({ channel, visible, onClose }: Props) => {
    const app = useAppStore();
    const space = channel.spaceId ? app.spaces.get(channel.spaceId) : null;
    const store = space?.memberLists.get(channel.listId);
    const sections = store?.list ?? [];
    const loadingMoreRef = useRef(false);

    const loadedCount = sections.reduce(
      (acc: number, section: any) => acc + (section.items?.length ?? 0),
      0,
    );

    const memberCount =
      typeof store?.memberCount === "number" ? store.memberCount : 0;

    const hasMore = !store ? true : loadedCount < memberCount;
    const isInitialLoading = visible && sections.length === 0 && hasMore;

    const handleLoadMore = useCallback(() => {
      if (!space || !channel.spaceId || !hasMore || loadingMoreRef.current) {
        return;
      }

      loadingMoreRef.current = true;
      app.gateway.requestMemberListRange(
        channel.spaceId,
        channel.id,
        PAGE_SIZE,
      );

      setTimeout(() => {
        loadingMoreRef.current = false;
      }, 500);
    }, [space, channel.spaceId, channel.id, hasMore, app.gateway]);

    useEffect(() => {
      if (!visible || !channel.spaceId || !hasMore) return;

      app.gateway.requestMemberListRange(
        channel.spaceId,
        channel.id,
        PAGE_SIZE,
      );
    }, [visible, channel.id, channel.spaceId, app.gateway, hasMore]);

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!hasMore || sections.length === 0) return;

        const { layoutMeasurement, contentOffset, contentSize } =
          event.nativeEvent;

        if (
          layoutMeasurement.height + contentOffset.y >=
          contentSize.height - 120
        ) {
          handleLoadMore();
        }
      },
      [handleLoadMore, hasMore, sections.length],
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <Screen
          elevation={app.settings?.preferEmbossed ? 4 : 1}
          style={{ flexDirection: "column" }}
        >
          <ScreenHeader safeTop>
            <Typography level="body-md" weight="bold" style={{ flex: 1 }}>
              Members — {memberCount || loadedCount}
            </Typography>
            <IconButton padding={8} onPress={onClose}>
              <XIcon size={20} />
            </IconButton>
          </ScreenHeader>

          {isInitialLoading ? (
            <Typography
              level="body-sm"
              textColor="muted"
              style={{
                textAlign: "center",
                padding: 24,
                flex: 1,
              }}
            >
              Loading members...
            </Typography>
          ) : sections.length === 0 ? (
            <Typography
              level="body-sm"
              textColor="muted"
              style={{
                textAlign: "center",
                padding: 24,
                flex: 1,
              }}
            >
              No members to show.
            </Typography>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: "transparent" }}
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingBottom: 24,
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {sections.map((category: any, index: number) => (
                <ListSection
                  key={`${category.name}-${index}`}
                  name={category.name}
                  items={category.items.map((member: any) => (
                    <MemberListItem
                      key={
                        member.userId ??
                        member.user?.id ??
                        `${category.name}-${index}`
                      }
                      member={member}
                      space={space}
                      isOwner={
                        (member.userId ?? member.user?.id) === space?.ownerId
                      }
                    />
                  ))}
                />
              ))}

              {hasMore && (
                <Typography
                  level="body-sm"
                  textColor="muted"
                  style={{
                    textAlign: "center",
                    paddingVertical: 16,
                  }}
                >
                  Loading more members...
                </Typography>
              )}
            </ScrollView>
          )}
        </Screen>
      </Modal>
    );
  },
);
