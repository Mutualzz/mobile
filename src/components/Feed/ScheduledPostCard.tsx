import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { MarkdownRenderer } from "@components/Markdown/MarkdownRenderer/MarkdownRenderer";
import { MessageEmbed } from "@components/Message/MessageEmbed";
import { MessageSticker } from "@components/Message/MessageSticker";
import { PostAttachment } from "@components/Feed/PostAttachment";
import { Paper } from "@components/Paper";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { ExpressionType } from "@mutualzz/types";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { Post } from "@stores/objects/Post";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { TrashIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, useWindowDimensions } from "react-native";

interface Props {
  post: Post;
}

export const ScheduledPostCard = observer(({ post }: Props) => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [rescheduling, setRescheduling] = useState(false);
  const [nextDate, setNextDate] = useState(
    post.scheduledFor ?? new Date(Date.now() + 60 * 60_000),
  );
  const [showPicker, setShowPicker] = useState(false);

  const { mutate: publishNow, isPending: isPublishing } = useMutation({
    mutationFn: () => post.publishNow(),
  });

  const { mutate: reschedule, isPending: isRescheduling } = useMutation({
    mutationFn: (date: Date) => post.reschedule(date),
    onSuccess: () => setRescheduling(false),
  });

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: () => post.delete(),
  });

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (date) setNextDate(date);
  };

  return (
    <Paper
      style={{
        padding: 14,
        borderRadius: 12,
        gap: 12,
      }}
      elevation={app.settings?.preferEmbossed ? 3 : 0}
    >
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <UserAvatar user={post.author} size="md" />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography level="body-md" weight={700} truncate="single">
              {post.author?.displayName ?? t("unknownUser")}
            </Typography>
            <Typography level="body-xs" textColor="muted">
              {post.scheduledFor
                ? t("feed.scheduled.scheduledFor", {
                    datetime: dayjs(post.scheduledFor).format(
                      "dddd, MMMM D, YYYY h:mm A",
                    ),
                  })
                : t("feed.scheduled.scheduledForUnknown")}
            </Typography>
          </Box>
        </Box>

        <IconButton
          variant="plain"
          color="danger"
          padding={6}
          disabled={isDeleting}
          onPress={() => deletePost()}
        >
          <TrashIcon size={18} />
        </IconButton>
      </Box>

      {post.expressions.filter((e) => e.type === ExpressionType.Sticker).length >
        0 && (
        <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {post.expressions
            .filter((e) => e.type === ExpressionType.Sticker)
            .map((sticker) => (
              <MessageSticker key={sticker.id} sticker={sticker} size={72} />
            ))}
        </Box>
      )}

      {post.content && <MarkdownRenderer value={post.content} />}

      {post.embeds.length > 0 && (
        <Box style={{ gap: 8 }}>
          {post.embeds.map((embed, index) => (
            <MessageEmbed key={index} embed={embed} />
          ))}
        </Box>
      )}

      {post.attachments.length > 0 && (
        <Box style={{ gap: 8 }}>
          {post.attachments.map((attachment) => (
            <PostAttachment
              key={attachment.id}
              attachment={attachment}
              maxWidth={width - 56}
            />
          ))}
        </Box>
      )}

      {post.hashtags.length > 0 && (
        <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {post.hashtags.map((hashtag) => (
            <Typography
              key={hashtag.id}
              level="body-sm"
              style={{ color: theme.colors.info }}
            >
              #{hashtag.tag}
            </Typography>
          ))}
        </Box>
      )}

      {rescheduling && (
        <Box style={{ gap: 8 }}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: `${theme.typography.colors.muted}40`,
            }}
          >
            <Typography level="body-sm">{nextDate.toLocaleString()}</Typography>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={nextDate}
              mode="datetime"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}
          <IconButton variant="plain" padding={4} onPress={() => setRescheduling(false)}>
            <XIcon size={14} />
          </IconButton>
        </Box>
      )}

      <Box
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        {rescheduling ? (
          <Button
            size="sm"
            disabled={nextDate.getTime() <= Date.now() || isRescheduling}
            onPress={() => reschedule(nextDate)}
          >
            {t("feed.scheduled.saveTime")}
          </Button>
        ) : (
          <Button size="sm" variant="soft" onPress={() => setRescheduling(true)}>
            {t("feed.scheduled.reschedule")}
          </Button>
        )}
        <Button size="sm" disabled={isPublishing} onPress={() => publishNow()}>
          {t("feed.scheduled.publishNow")}
        </Button>
      </Box>
    </Paper>
  );
});
