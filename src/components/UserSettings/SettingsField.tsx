import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { Box, Slider, Switch, Typography } from "@mutualzz/ui-native";
import { useAppStore } from "@hooks/useStores";
import { Pressable, ScrollView } from "react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretRightIcon, CheckIcon } from "phosphor-react-native";
import { useTheme } from "@mutualzz/ui-native";

export function SettingsScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function SettingsNavSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const app = useAppStore();

  return (
    <Paper
      style={{
        marginHorizontal: 12,
        padding: 12,
        borderRadius: 12,
        flexDirection: "column",
        minWidth: 0,
      }}
      elevation={app.settings?.preferEmbossed ? 3 : 0}
    >
      {title ? (
        <Typography level="body-sm" textColor="muted">
          {title}
        </Typography>
      ) : null}
      {children}
    </Paper>
  );
}

export function SettingsNavButton({
  label,
  icon,
  onPress,
  color,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  color?: "danger" | "neutral";
}) {
  const app = useAppStore();

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 3 : 0}
      style={{
        marginHorizontal: 12,
        borderRadius: 12,
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Button
        variant="plain"
        color={color}
        fullWidth
        padding={12}
        horizontalAlign="left"
        style={{ borderRadius: 12, minWidth: 0 }}
        startDecorator={icon}
        onPress={onPress}
      >
        {label}
      </Button>
    </Paper>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  const app = useAppStore();

  return (
    <Box style={{ gap: 12 }}>
      {title ? (
        <Typography level="body-md" weight={700}>
          {title}
        </Typography>
      ) : null}
      <Paper
        style={{ padding: 16, borderRadius: 12, gap: 12, minWidth: 0 }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        {description ? (
          <Typography level="body-xs" textColor="muted">
            {description}
          </Typography>
        ) : null}
        {children}
      </Paper>
    </Box>
  );
}

export function SettingsActionRow({
  title,
  description,
  actionLabel,
  onPress,
  actionColor,
  actionDisabled,
}: {
  title: string;
  description?: ReactNode;
  actionLabel: string;
  onPress: () => void;
  actionColor?: "primary" | "danger" | "neutral";
  actionDisabled?: boolean;
}) {
  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography level="body-sm" weight={600}>
          {title}
        </Typography>
        {description ? (
          typeof description === "string" ? (
            <Typography level="body-xs" textColor="muted">
              {description}
            </Typography>
          ) : (
            description
          )
        ) : null}
      </Box>
      <Button
        variant="outlined"
        color={actionColor}
        size="sm"
        disabled={actionDisabled}
        onPress={onPress}
      >
        {actionLabel}
      </Button>
    </Box>
  );
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Box
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Box style={{ flex: 1, gap: 2 }}>
        <Typography level="body-sm" weight={700}>
          {title}
        </Typography>
        {description ? (
          typeof description === "string" ? (
            <Typography level="body-xs" textColor="muted">
              {description}
            </Typography>
          ) : (
            description
          )
        ) : null}
      </Box>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
    </Box>
  );
}

export function SettingsSelectRow({
  title,
  description,
  value,
  onPress,
}: {
  title: string;
  description?: string;
  value: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ gap: 8 }}
    >
      <Box style={{ gap: 2 }}>
        <Typography level="body-sm" weight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography level="body-xs" textColor="muted">
            {description}
          </Typography>
        ) : null}
      </Box>
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: "rgba(127,127,127,0.12)",
        }}
      >
        <Typography level="body-sm" style={{ flex: 1 }} truncate="single">
          {value}
        </Typography>
        <CaretRightIcon
          size={16}
          color={theme.typography.colors.muted}
          weight="bold"
        />
      </Box>
    </Pressable>
  );
}

const SLIDER_COMMIT_DEBOUNCE_MS = 300;

export function SettingsSliderRow({
  title,
  description,
  value,
  min,
  max,
  step,
  valueLabel,
  formatValueLabel,
  onChange,
  onPreviewChange,
  commitDebounceMs = SLIDER_COMMIT_DEBOUNCE_MS,
}: {
  title: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueLabel?: string;
  formatValueLabel?: (value: number) => string;
  onChange: (value: number) => void;
  onPreviewChange?: (value: number) => void;
  commitDebounceMs?: number;
}) {
  const [localValue, setLocalValue] = useState(value);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
        onChange(localValue);
      }
    };
  }, [localValue, onChange]);

  const commit = (next: number) => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    onChange(next);
  };

  const scheduleCommit = (next: number) => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      onChange(next);
    }, commitDebounceMs);
  };

  const resolvedLabel =
    formatValueLabel?.(localValue) ?? valueLabel ?? String(localValue);

  return (
    <Box style={{ gap: 8 }}>
      <Box
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <Box style={{ flex: 1, gap: 2 }}>
          <Typography level="body-sm" weight={700}>
            {title}
          </Typography>
          {description ? (
            <Typography level="body-xs" textColor="muted">
              {description}
            </Typography>
          ) : null}
        </Box>
        <Typography level="body-xs" textColor="muted">
          {resolvedLabel}
        </Typography>
      </Box>
      <Slider
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(next) => {
          const resolved = Array.isArray(next) ? (next[0] ?? min) : next;
          setLocalValue(resolved);
          onPreviewChange?.(resolved);
          scheduleCommit(resolved);
        }}
        onChangeCommitted={(next) => {
          const resolved = Array.isArray(next) ? (next[0] ?? min) : next;
          setLocalValue(resolved);
          onPreviewChange?.(resolved);
          if (commitTimerRef.current) {
            clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
          }
          onChange(resolved);
        }}
      />
    </Box>
  );
}

export function SettingsListRow({
  onPress,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

export function SettingsOptionPicker({
  title,
  options,
  selected,
  onSelect,
  scrollable,
  emptyLabel,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  scrollable?: boolean;
  emptyLabel?: string;
}) {
  const { theme } = useTheme();
  const app = useAppStore();

  const rows = options.map((option) => {
    const active = option.value === selected;

    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onSelect(option.value)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: active
            ? `${theme.colors.primary}18`
            : undefined,
        }}
      >
        <Typography
          level="body-sm"
          weight={active ? 600 : undefined}
          style={{ flex: 1 }}
          truncate="single"
        >
          {option.label}
        </Typography>
        {active ? (
          <CheckIcon
            size={16}
            weight="bold"
            color={theme.colors.success}
          />
        ) : null}
      </Pressable>
    );
  });

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 4 : 2}
      style={{
        width: "100%",
        alignSelf: "stretch",
        borderRadius: 16,
        padding: 8,
        gap: 2,
      }}
    >
      <Typography
        level="body-md"
        weight={700}
        style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      >
        {title}
      </Typography>
      {emptyLabel && options.length === 0 ? (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ paddingHorizontal: 12, paddingBottom: 8 }}
        >
          {emptyLabel}
        </Typography>
      ) : scrollable ? (
        <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
          {rows}
        </ScrollView>
      ) : (
        rows
      )}
    </Paper>
  );
}
