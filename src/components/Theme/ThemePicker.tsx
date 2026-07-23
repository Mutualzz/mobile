import { IconButton } from "@components/IconButton";
import type { Theme as StoreTheme } from "@stores/objects/Theme";
import { Box, Divider, Typography, useTheme } from "@mutualzz/ui-native";
import { getThemeSwatchStops, type ThemeSwatchStop } from "@utils/themeSwatch";
import { useScaledSquareSize, useScaledThemeSwatchSize } from "@utils/accessibilityLayout";
import { CheckIcon, RepeatIcon, TrashIcon } from "phosphor-react-native";
import { Pressable, View } from "react-native";

const SWATCH_SIZE = 64;

const SelectionBadge = ({
  badgeIcon = "check",
}: {
  badgeIcon?: "check" | "sync";
}) => {
  const { theme } = useTheme();
  const badgeSize = useScaledSquareSize(24);

  return (
    <View
      style={{
        position: "absolute",
        top: -1,
        right: -2,
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.surface,
      }}
    >
      {badgeIcon === "sync" ? (
        <RepeatIcon size={14} color={theme.typography.colors.primary} />
      ) : (
        <CheckIcon size={14} color={theme.typography.colors.primary} />
      )}
    </View>
  );
};

const ThemeSwatchFill = ({ stops }: { stops: ThemeSwatchStop[] }) => (
  <View
    style={{
      flex: 1,
      flexDirection: "row",
      width: "100%",
      height: "100%",
    }}
  >
    {stops.map((stop, index) => (
      <View
        key={`${stop.color}-${index}`}
        style={{
          flex: stop.widthPercent,
          backgroundColor: stop.color,
        }}
      />
    ))}
  </View>
);

export const ThemeSwatch = ({
  stops,
  selected,
  onPress,
  badgeIcon = "check",
  alwaysShowBadge = false,
  onDelete,
  deleting = false,
}: {
  stops: ThemeSwatchStop[];
  selected: boolean;
  onPress: () => void;
  badgeIcon?: "check" | "sync";
  alwaysShowBadge?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) => {
  const { theme } = useTheme();
  const swatchSize = useScaledThemeSwatchSize(SWATCH_SIZE);
  const showBadge = alwaysShowBadge || selected;
  const outline = 3;

  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 4 }}>
      <View
        style={{
          position: "relative",
          width: swatchSize,
          height: swatchSize,
        }}
      >
        {selected && (
          <View
            style={{
              position: "absolute",
              top: -outline,
              left: -outline,
              width: swatchSize + outline * 2,
              height: swatchSize + outline * 2,
              borderRadius: (swatchSize + outline * 2) / 2,
              borderWidth: outline,
              borderColor: theme.colors.primary,
            }}
          />
        )}
        {onDelete && selected && (
          <IconButton
            padding={4}
            size={12}
            color="danger"
            disabled={deleting}
            onPress={onDelete}
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              zIndex: 2,
            }}
          >
            <TrashIcon size={12} weight="fill" />
          </IconButton>
        )}
        <View
          style={{
            width: swatchSize,
            height: swatchSize,
            borderRadius: swatchSize / 2,
            overflow: "hidden",
            borderWidth: outline,
            borderColor: theme.colors.primary,
          }}
        >
          <ThemeSwatchFill stops={stops} />
        </View>
        {showBadge && <SelectionBadge badgeIcon={badgeIcon} />}
      </View>
    </Pressable>
  );
};

export const ThemeGrid = ({
  themes,
  isSelected,
  onSelect,
  onDelete,
  deletingId,
}: {
  themes: StoreTheme[];
  isSelected: (theme: StoreTheme) => boolean;
  onSelect: (theme: StoreTheme) => void;
  onDelete?: (theme: StoreTheme) => void;
  deletingId?: string | null;
}) => (
  <Box
    style={{
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingVertical: 8,
    }}
  >
    {themes.map((theme) => (
      <ThemeSwatch
        key={theme.id}
        stops={getThemeSwatchStops(
          theme.colors.background,
          theme.colors.primary,
        )}
        selected={isSelected(theme)}
        onPress={() => onSelect(theme)}
        onDelete={onDelete ? () => onDelete(theme) : undefined}
        deleting={deletingId === theme.id}
      />
    ))}
  </Box>
);

export function SectionHeader({ title }: { title: string }) {
  return (
    <Divider lineColor="muted" style={{ marginTop: 8, marginBottom: 4 }}>
      <Typography level="body-sm" weight={700}>
        {title}
      </Typography>
    </Divider>
  );
}
