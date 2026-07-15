import { Button } from "@components/Button";
import { ProfileWidgetContentEditorSheet } from "@components/Profile/widgets/editor/ProfileWidgetContentEditorSheet";
import { ProfileWidgetPalette } from "@components/Profile/widgets/editor/ProfileWidgetPalette";
import { ProfileWidgetEditableList } from "@components/Profile/widgets/editor/ProfileWidgetEditableList";
import { ProfileWidgetsEmptyEditor } from "@components/Profile/widgets/editor/ProfileWidgetsEmptyEditor";
import {
  addMobileWidget,
  copyDesktopBlocksToMobile,
  removeMobileWidget,
  reorderMobileBlocks,
  updateMobileWidget,
} from "@components/Profile/widgets/editor/profileWidgetEditor.utils";
import type { AccountStore } from "@stores/Account.store";
import type { UserProfile } from "@stores/objects/UserProfile";
import type {
  APIMobileProfileBlock,
  APIProfileBlock,
  ProfileBlockSize,
  ProfileBlockType,
} from "@mutualzz/types";
import { Box, Modal, Typography, useTheme } from "@mutualzz/ui-native";
import { XIcon } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@components/IconButton";

interface Props {
  visible?: boolean;
  onClose: () => void;
  profile: UserProfile;
  user: AccountStore;
  mobileBlocks: APIMobileProfileBlock[];
  onMobileBlocksChange: (blocks: APIMobileProfileBlock[]) => void;
  desktopBlocks: APIProfileBlock[];
  onSave: () => void;
  saving: boolean;
  error: string | null;
  /** Content only — open via ModalRoot from settings to avoid nested RN Modals. */
  embedded?: boolean;
}

export function ProfileWidgetEditorModal({
  visible = true,
  onClose,
  profile,
  user,
  mobileBlocks,
  onMobileBlocksChange,
  desktopBlocks,
  onSave,
  saving,
  error,
  embedded = false,
}: Props) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  // Local copy so ModalRoot snapshots stay interactive after open.
  const [blocks, setBlocks] = useState(mobileBlocks);

  useEffect(() => {
    if (visible || embedded) setBlocks(mobileBlocks);
  }, [visible, embedded, mobileBlocks]);

  const syncBlocks = (next: APIMobileProfileBlock[]) => {
    setBlocks(next);
    onMobileBlocksChange(next);
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
    syncBlocks(copyDesktopBlocksToMobile(desktopBlocks));
  };

  const body = (
      <Box
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          position: "relative",
        }}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <IconButton padding={6} onPress={onClose}>
            <XIcon size={20} />
          </IconButton>
          {editMode && (
            <Button
              size="sm"
              color="neutral"
              onPress={() => setEditMode(false)}
            >
              {t("profile.done")}
            </Button>
          )}
        </Box>

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
                desktopBlocks.length > 0 ? handleCopyFromDesktop : undefined
              }
            />
          ) : (
            <ProfileWidgetEditableList
              blocks={sortedBlocks}
              profile={profile}
              user={user}
              editMode={editMode}
              onEnterEditMode={() => setEditMode(true)}
              onChange={syncBlocks}
              onEditContent={(block) => setEditingBlockId(block.id)}
              onDelete={handleDelete}
              onChangeSize={handleChangeSize}
              reorder={reorderMobileBlocks}
            />
          )}

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
          <Button color="primary" fullWidth disabled={saving} onPress={onSave}>
            {saving ? t("profile.saving") : t("profile.editor.saveProfile")}
          </Button>
        </Box>

        <ProfileWidgetContentEditorSheet
          visible={!!editingBlock}
          onClose={() => setEditingBlockId(null)}
          block={editingBlock}
          profile={profile}
          onUpdate={handleUpdateContent}
          presentation="overlay"
          onDelete={(blockId) => {
            handleDelete(blockId);
            setEditingBlockId(null);
          }}
        />
      </Box>
  );

  if (embedded) return body;

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      hideBackdrop
      showCloseButton={false}
      disableBackdropClick
      style={{ paddingVertical: 0 }}
    >
      {body}
    </Modal>
  );
}
