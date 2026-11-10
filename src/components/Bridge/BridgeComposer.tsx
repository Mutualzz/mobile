import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { CHAT_COMPOSER_NATIVE_ID } from "@contexts/ChatKeyboard.context";
import { useComposerSafePadding } from "@hooks/useKeyboardOffset";
import { useAppStore } from "@hooks/useStores";
import {
  Box,
  MAX_FONT_SCALE_MULTIPLIER,
  scaledLayoutSize,
  useFontScale,
  useTheme,
} from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { PaperPlaneTiltIcon } from "phosphor-react-native";
import { TextInput } from "react-native";

const MAX_BRIDGE_MESSAGE_LENGTH = 500;

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  sending: boolean;
}

export const BridgeComposer = observer(
  ({ value, onChange, onSend, placeholder, sending }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const fontScale = useFontScale();
    const composerBottomPadding = useComposerSafePadding();
    const hasWallpaper = Boolean(theme.backgroundImageUrl);
    const canSend = value.trim().length > 0 && !sending;

    return (
      <Paper
        surfaceRole={hasWallpaper ? "composer" : undefined}
        elevation={hasWallpaper ? 0 : app.settings?.preferEmbossed ? 3 : 0}
        style={{
          flexShrink: 0,
          flexGrow: 0,
          ...(hasWallpaper ? null : { backgroundColor: theme.colors.surface }),
          paddingHorizontal: 12,
          paddingBottom: composerBottomPadding,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: `${theme.colors.neutral}33`,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
        }}
      >
        <Box style={{ flexDirection: "row", alignItems: "center" }}>
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 0}
            style={{
              flex: 1,
              marginRight: 8,
              borderRadius: 999,
              minHeight: scaledLayoutSize(44, fontScale, 1.5),
              justifyContent: "center",
            }}
          >
            <TextInput
              nativeID={CHAT_COMPOSER_NATIVE_ID}
              value={value}
              onChangeText={onChange}
              onSubmitEditing={onSend}
              submitBehavior="submit"
              returnKeyType="send"
              maxLength={MAX_BRIDGE_MESSAGE_LENGTH}
              placeholder={placeholder}
              placeholderTextColor={theme.typography.colors.muted}
              allowFontScaling
              maxFontSizeMultiplier={MAX_FONT_SCALE_MULTIPLIER}
              style={{
                color: theme.typography.colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </Paper>
          <IconButton
            padding={8}
            style={{ borderRadius: 999 }}
            color="primary"
            onPress={onSend}
            disabled={!canSend}
            hitSlop={4}
          >
            <PaperPlaneTiltIcon size={20} weight="fill" />
          </IconButton>
        </Box>
      </Paper>
    );
  },
);
