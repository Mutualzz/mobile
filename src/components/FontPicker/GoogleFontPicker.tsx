import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { useGoogleFont } from "@hooks/useGoogleFont";
import {
  DEFAULT_FONT_FAMILY,
  extractPrimaryFontFamily,
  getFontByFamily,
  searchFonts,
} from "@mutualzz/ui-core";
import { Box, Input, Typography, useTheme } from "@mutualzz/ui-native";
import { CheckIcon, UploadSimpleIcon } from "phosphor-react-native";
import * as DocumentPicker from "expo-document-picker";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable } from "react-native";

interface Props {
  value: string | null | undefined;
  onChange: (family: string | null) => void;
  label?: string;
  description?: string;
  fontOwnerId?: string | null;
}

export const GoogleFontPicker = observer(
  ({
    value,
    onChange,
    label,
    description,
    fontOwnerId,
  }: Props) => {
    const { t } = useTranslation("common");
    const { t: tSettings } = useTranslation("settings");
    const app = useAppStore();
    const { theme } = useTheme();
    const [query, setQuery] = useState("");
    const [uploading, setUploading] = useState(false);

    const resolvedLabel = label ?? tSettings("themeCreator.colors.appFont");
    const resolvedDescription =
      description ?? tSettings("themeCreator.colors.appFontDescriptionShort");

    const ownerId = fontOwnerId ?? app.account?.id ?? null;
    const resolvedValue = value ?? DEFAULT_FONT_FAMILY;
    const { fontFamily, ready } = useGoogleFont(resolvedValue, ownerId);

    const filteredFonts = useMemo(() => searchFonts(query), [query]);
    const selectedFont = getFontByFamily(resolvedValue);

    const uploadFont = async () => {
      if (!ownerId) return;

      const result = await DocumentPicker.getDocumentAsync({
        type: ["font/ttf", "font/otf", "font/woff", "font/woff2"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      try {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append("file", {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
        } as unknown as Blob);

        const upload = await app.rest.postFormData<{
          hash: string;
          fontFamily: string;
        }>("/@me/profile/assets", formData, { type: "font" });

        if (upload?.fontFamily) onChange(upload.fontFamily);
      } finally {
        setUploading(false);
      }
    };

    return (
      <Box style={{ gap: 12 }}>
        <Box style={{ gap: 4 }}>
          <Typography level="body-xs" weight={700}>
            {resolvedLabel}
          </Typography>
          {resolvedDescription && (
            <Typography level="body-xs" textColor="muted">
              {resolvedDescription}
            </Typography>
          )}
          <Typography
            level="body-sm"
            style={{
              fontFamily: ready ? fontFamily : undefined,
            }}
          >
            {selectedFont?.family ??
              extractPrimaryFontFamily(resolvedValue) ??
              resolvedValue}
          </Typography>
        </Box>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={tSettings("fonts.searchPlaceholderShort")}
        />

        <FlatList
          data={filteredFonts}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 220 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const active =
              item.family.toLowerCase() === resolvedValue.toLowerCase() ||
              resolvedValue.toLowerCase().includes(item.family.toLowerCase());

            return (
              <Pressable
                onPress={() => onChange(item.family)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: active
                    ? `${theme.colors.primary}18`
                    : undefined,
                }}
              >
                <Typography level="body-sm" style={{ flex: 1 }}>
                  {item.family}
                </Typography>
                {active && (
                  <CheckIcon
                    size={16}
                    weight="bold"
                    color={theme.colors.success}
                  />
                )}
              </Pressable>
            );
          }}
        />

        <Button
          variant="soft"
          startDecorator={<UploadSimpleIcon size={16} weight="bold" />}
          disabled={!ownerId || uploading}
          onPress={() => void uploadFont()}
        >
          {uploading
            ? tSettings("expressions.uploading")
            : t("uploadCustomFont")}
        </Button>
      </Box>
    );
  },
);
