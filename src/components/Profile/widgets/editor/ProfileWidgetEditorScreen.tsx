import { Button } from "@components/Button";
import { ProfileWidgetContentEditorSheet } from "@components/Profile/widgets/editor/ProfileWidgetContentEditorSheet";
import { ProfileWidgetEditableList } from "@components/Profile/widgets/editor/ProfileWidgetEditableList";
import { ProfileWidgetPalette } from "@components/Profile/widgets/editor/ProfileWidgetPalette";
import { ProfileWidgetsEmptyEditor } from "@components/Profile/widgets/editor/ProfileWidgetsEmptyEditor";
import {
  addMobileWidget,
  copyDesktopBlocksToMobile,
  prepareMobileBlocksForSave,
  removeMobileWidget,
  reorderMobileBlocks,
  updateMobileWidget,
  validateMobileBlocksForSave,
} from "@components/Profile/widgets/editor/profileWidgetEditor.utils";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type {
  APIMobileProfileBlock,
  ProfileBlockSize,
  ProfileBlockType,
} from "@mutualzz/types";
import { Box, Typography, hasOpenSheets, useTheme } from "@mutualzz/ui-native";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ProfileWidgetEditorScreen = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const account = app.account;
  const { back } = useAppNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [editMode, setEditMode] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<APIMobileProfileBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialBlocksRef = useRef<string>("[]");

  const { data: fetchedProfile, isLoading } = useQuery({
    queryKey: ["profile-widgets-editor", account?.id],
    enabled: !!account?.id,
    queryFn: () => app.profiles.resolve(account!.id, true),
  });

  const profile = account?.id
    ? (app.profiles.get(account.id) ?? fetchedProfile)
    : undefined;

  useEffect(() => {
    if (!profile) return;
    const next = JSON.parse(
      JSON.stringify(profile.mobileBlocks),
    ) as APIMobileProfileBlock[];
    setBlocks(next);
    initialBlocksRef.current = JSON.stringify(next);
  }, [profile?.updatedAt, profile?.userId]);

  const isDirty = JSON.stringify(blocks) !== initialBlocksRef.current;

  const handleBack = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        t("profile.editor.leaveTitle"),
        t("profile.editor.leaveDescription"),
        [
          { text: t("profile.editor.keepEditing"), style: "cancel" },
          {
            text: t("profile.editor.leave"),
            style: "destructive",
            onPress: () => back(),
          },
        ],
      );
      return;
    }
    back();
  }, [back, isDirty, t]);

  const handleBackRef = useRef(handleBack);
  handleBackRef.current = handleBack;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (hasOpenSheets()) return false;
        handleBackRef.current();
        return true;
      },
    );
    return () => subscription.remove();
  }, []);

  if (!account) return null;

  const syncBlocks = (next: APIMobileProfileBlock[]) => {
    setBlocks(next);
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const editingBlock = blocks.find((b) => b.id === editingBlockId) ?? null;

  const handleAddWidget = (type: ProfileBlockType) => {
    syncBlocks(addMobileWidget(blocks, type));
  };

  const handleDelete = (blockId: string) => {
    syncBlocks(removeMobileWidget(blocks, blockId));
  };

  const handleChangeSize = (blockId: string, size: ProfileBlockSize) => {
    syncBlocks(updateMobileWidget(blocks, blockId, { size }));
  };

  const handleUpdateContent = (
    blockId: string,
    patch: Record<string, unknown>,
  ) => {
    syncBlocks(updateMobileWidget(blocks, blockId, patch));
  };

  const handleCopyFromDesktop = () => {
    if (!profile) return;
    syncBlocks(copyDesktopBlocksToMobile(profile.blocks));
  };

  const saveWidgets = async () => {
    if (saving || !profile) return;

    const mobileBlocksError = validateMobileBlocksForSave(blocks);
    if (mobileBlocksError) {
      setError(mobileBlocksError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await app.profiles.save({
        bio: profile.bio ?? null,
        banner: profile.banner ?? null,
        backgroundColor: profile.backgroundColor ?? null,
        backgroundImage: profile.backgroundImage ?? null,
        pageFontFamily: profile.pageFontFamily ?? null,
        profileMusic: profile.profileMusic ?? null,
        blocks: profile.blocks,
        mobileBlocks: prepareMobileBlocksForSave(blocks),
      });
      initialBlocksRef.current = JSON.stringify(blocks);
      back();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("profile.editor.failedSaveProfile"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsScreen
      title={t("profile.editor.mobileWidgets")}
      onBack={handleBack}
      contentStyle={{ flex: 1 }}
    >
      {isLoading && !profile ? (
        <Box
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </Box>
      ) : (
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            backgroundColor: theme.colors.background,
          }}
        >
          {editMode && (
            <Box
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Button
                size="sm"
                color="neutral"
                onPress={() => setEditMode(false)}
              >
                {t("profile.done")}
              </Button>
            </Box>
          )}

          <ProfileWidgetPalette onAddWidget={handleAddWidget} />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 16,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {sortedBlocks.length === 0 ? (
              <ProfileWidgetsEmptyEditor
                onCopyFromDesktop={
                  profile && profile.blocks.length > 0
                    ? handleCopyFromDesktop
                    : undefined
                }
              />
            ) : profile ? (
              <ProfileWidgetEditableList
                blocks={sortedBlocks}
                profile={profile}
                user={account}
                editMode={editMode}
                onEnterEditMode={() => setEditMode(true)}
                onChange={syncBlocks}
                onEditContent={(block) => setEditingBlockId(block.id)}
                onDelete={handleDelete}
                onChangeSize={handleChangeSize}
                reorder={reorderMobileBlocks}
              />
            ) : null}

            {error && (
              <Typography
                level="body-sm"
                color="danger"
                style={{ marginTop: 12 }}
              >
                {error}
              </Typography>
            )}
          </ScrollView>

          <Box
            style={{
              padding: 16,
              paddingBottom: insets.bottom + 16,
              flexShrink: 0,
            }}
          >
            <Button
              color="primary"
              fullWidth
              disabled={saving || !profile}
              onPress={() => void saveWidgets()}
            >
              {saving ? t("profile.saving") : t("profile.editor.saveProfile")}
            </Button>
          </Box>

          {profile ? (
            <ProfileWidgetContentEditorSheet
              visible={!!editingBlock}
              onClose={() => setEditingBlockId(null)}
              block={editingBlock}
              profile={profile}
              onUpdate={handleUpdateContent}
              onDelete={(blockId) => {
                handleDelete(blockId);
                setEditingBlockId(null);
              }}
            />
          ) : null}
        </Box>
      )}
    </SettingsScreen>
  );
});
