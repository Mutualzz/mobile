import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import {
  isValidCustomReminder,
  type MessageSchedulePreset,
} from "@mutualzz/client";
import { Box, Divider, Typography, useTheme } from "@mutualzz/ui-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import type { TFunction } from "i18next";
import { observer } from "mobx-react-lite";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, View } from "react-native";

const HOUR_MS = 60 * 60 * 1000;

export interface TimePreset {
  key: string;
  label: string;
  time: Date;
}

export const schedulePresetLabel = (
  translate: TFunction,
  preset: MessageSchedulePreset,
  time: Date,
) => {
  const formattedTime = dayjs(time).format("h:mma");
  if (preset === "nextMonday")
    return translate("chat:scheduledMessages.dayAt", {
      day: dayjs(time).format("dddd"),
      time: formattedTime,
    });
  return translate("chat:scheduledMessages.tomorrowAt", {
    time: formattedTime,
  });
};

interface Props {
  sheetId: string;
  title: string;
  confirmLabel: string;
  presets: TimePreset[];
  initial?: Date;
  extra?: ReactNode;
  onConfirm: (time: Date) => Promise<boolean>;
}

type PickerStep = "date" | "time" | "datetime" | null;

export const PickTimeSheet = observer(
  ({
    sheetId,
    title,
    confirmLabel,
    presets,
    initial,
    extra,
    onConfirm,
  }: Props) => {
    const { theme } = useTheme();
    const { closeSheet } = useSheet();
    const { t } = useTranslation("chat");
    const [selected, setSelected] = useState(
      () => initial ?? new Date(Date.now() + HOUR_MS),
    );
    const [pickerStep, setPickerStep] = useState<PickerStep>(null);
    const [saving, setSaving] = useState(false);

    const isValid = isValidCustomReminder(selected);

    const confirm = async (time: Date) => {
      setSaving(true);
      const succeeded = await onConfirm(time);
      setSaving(false);
      if (succeeded) closeSheet(sheetId);
    };

    const openPicker = () =>
      setPickerStep(Platform.OS === "ios" ? "datetime" : "date");

    const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "dismissed" || !date) {
        setPickerStep(null);
        return;
      }

      if (pickerStep === "date") {
        const next = new Date(selected);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setSelected(next);
        setPickerStep("time");
        return;
      }

      if (pickerStep === "time") {
        const next = new Date(selected);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setSelected(next);
        setPickerStep(null);
        return;
      }

      setSelected(date);
    };

    return (
      <View style={{ width: "100%", padding: 16, gap: 12 }}>
        <Typography level="body-md" weight={700}>
          {title}
        </Typography>

        <Box style={{ gap: 2 }}>
          {presets.map((preset) => (
            <Pressable
              key={preset.key}
              disabled={saving}
              onPress={() => void confirm(preset.time)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: pressed ? theme.colors.surface : "transparent",
              })}
            >
              <Typography level="body-sm">{preset.label}</Typography>
              <Typography level="body-xs" textColor="muted">
                {dayjs(preset.time).format("ddd, MMM D")}
              </Typography>
            </Pressable>
          ))}
        </Box>

        <Divider />

        <Typography level="body-xs" textColor="muted">
          {t("scheduledMessages.pickDateTime")}
        </Typography>
        <Pressable
          onPress={openPicker}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.surface,
          }}
        >
          <Typography level="body-sm">
            {dayjs(selected).format("ddd, MMM D · h:mm A")}
          </Typography>
        </Pressable>
        {pickerStep && (
          <DateTimePicker
            value={selected}
            mode={pickerStep}
            minimumDate={pickerStep === "time" ? undefined : new Date()}
            onChange={onPickerChange}
          />
        )}
        {!isValid && (
          <Typography level="body-xs" textColor="muted">
            {t("reminders.customInvalid")}
          </Typography>
        )}

        {extra}

        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant="soft"
            color="neutral"
            disabled={saving}
            onPress={() => closeSheet(sheetId)}
            style={{ flex: 1 }}
          >
            {t("scheduledMessages.cancel")}
          </Button>
          <Button
            disabled={!isValid || saving}
            onPress={() => void confirm(selected)}
            style={{ flex: 1 }}
          >
            {confirmLabel}
          </Button>
        </Box>
      </View>
    );
  },
);
