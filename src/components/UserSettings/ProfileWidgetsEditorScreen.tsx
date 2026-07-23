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
import type { APIMobileProfileBlock } from "@mutualzz/types";
import { Box, Typography, hasOpenSheets } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, ScrollView } from "react-native";

export const ProfileWidgetsEditorScreen = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const account = app.account;
  const { back } = useAppNavigation();

  const [blocks, setBlocks] = useState<APIMobileProfileBlock[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingBlock, setEditingBlock] =
    useState<APIMobileProfileBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialBlocksRef = useRef("");

  const profile = account?.id ? app.profiles.get(account.id) : undefined;

  useEffect(() => {
    if (!profile) return;

    const next = JSON.parse(
      JSON.stringify(profile.mobileBlocks),
    ) as APIMobileProfileBlock[];
    setBlocks(next);
    initialBlocksRef.current = JSON.stringify(next);
    setEditMode(false);
    setEditingBlock(null);
    setError(null);
  }, [profile?.updatedAt, profile?.userId]);

  const apply = useCallback(() => {
    const validationError = validateMobileBlocksForSave(blocks);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!profile) return;

    profile.mobileBlocks = prepareMobileBlocksForSave(
      JSON.parse(JSON.stringify(blocks)) as APIMobileProfileBlock[],
    );
    back();
  }, [back, blocks, profile]);

  const handleBack = useCallback(() => {
    if (editingBlock) {
      setEditingBlock(null);
      return;
    }

    if (hasOpenSheets()) return;

    const dirty = JSON.stringify(blocks) !== initialBlocksRef.current;
    if (!dirty) {
      back();
      return;
    }

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
  }, [back, blocks, editingBlock, t]);

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

  if (!account || !profile) return null;

  return (
    <SettingsScreen
      title={t("profile.editor.editWidgets")}
      onBack={handleBack}
      contentStyle={{ flex: 1 }}
    >
      <Box style={{ flex: 1, minHeight: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 8,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {blocks.length === 0 ? (
            <ProfileWidgetsEmptyEditor
              onCopyFromDesktop={
                profile.blocks.length > 0
                  ? () => {
                      setBlocks(copyDesktopBlocksToMobile(profile.blocks));
                      setEditMode(true);
                      setError(null);
                    }
                  : undefined
              }
            />
          ) : null}

          <ProfileWidgetEditableList
            blocks={blocks}
            profile={profile}
            user={account}
            editMode={editMode}
            onEnterEditMode={() => setEditMode(true)}
            onChange={(next) => {
              setBlocks(next);
              setError(null);
            }}
            onEditContent={(block) => setEditingBlock(block)}
            onDelete={(blockId) => {
              setBlocks(removeMobileWidget(blocks, blockId));
              setError(null);
            }}
            onChangeSize={(blockId, size) => {
              setBlocks(updateMobileWidget(blocks, blockId, { size }));
            }}
            reorder={reorderMobileBlocks}
          />

          {error ? (
            <Typography level="body-sm" color="danger" variant="plain">
              {error}
            </Typography>
          ) : null}
        </ScrollView>

        <ProfileWidgetPalette
          onAddWidget={(type) => {
            setBlocks(addMobileWidget(blocks, type));
            setEditMode(true);
            setError(null);
          }}
        />

        <Box style={{ padding: 16, paddingTop: 8 }}>
          <Button color="primary" onPress={apply}>
            {t("profile.done")}
          </Button>
        </Box>
      </Box>

      <ProfileWidgetContentEditorSheet
        visible={!!editingBlock}
        block={editingBlock}
        profile={profile}
        onClose={() => setEditingBlock(null)}
        onUpdate={(blockId, patch) => {
          setBlocks((current) => updateMobileWidget(current, blockId, patch));
          setEditingBlock((current) =>
            current?.id === blockId ? { ...current, ...patch } : current,
          );
          setError(null);
        }}
        onDelete={(blockId) => {
          setBlocks((current) => removeMobileWidget(current, blockId));
          setEditingBlock(null);
          setError(null);
        }}
      />
    </SettingsScreen>
  );
});
