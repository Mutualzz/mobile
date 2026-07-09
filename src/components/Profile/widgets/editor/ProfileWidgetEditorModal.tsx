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
import { useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@components/IconButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  user: AccountStore;
  mobileBlocks: APIMobileProfileBlock[];
  onMobileBlocksChange: (blocks: APIMobileProfileBlock[]) => void;
  desktopBlocks: APIProfileBlock[];
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

export function ProfileWidgetEditorModal({
  visible,
  onClose,
  profile,
  user,
  mobileBlocks,
  onMobileBlocksChange,
  desktopBlocks,
  onSave,
  saving,
  error,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const sortedBlocks = [...mobileBlocks].sort((a, b) => a.order - b.order);
  const editingBlock = mobileBlocks.find((b) => b.id === editingBlockId) ?? null;

  const handleAddWidget = (type: ProfileBlockType) => {
    onMobileBlocksChange(addMobileWidget(mobileBlocks, type));
  };

  const handleDelete = (blockId: string) => {
    onMobileBlocksChange(removeMobileWidget(mobileBlocks, blockId));
  };

  const handleChangeSize = (blockId: string, size: ProfileBlockSize) => {
    onMobileBlocksChange(updateMobileWidget(mobileBlocks, blockId, { size }));
  };

  const handleUpdateContent = (blockId: string, patch: Record<string, unknown>) => {
    onMobileBlocksChange(updateMobileWidget(mobileBlocks, blockId, patch));
  };

  const handleCopyFromDesktop = () => {
    onMobileBlocksChange(copyDesktopBlocksToMobile(desktopBlocks));
  };

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
      <Box
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
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
            <Button size="sm" color="neutral" onPress={() => setEditMode(false)}>
              Done
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
              onChange={onMobileBlocksChange}
              onEditContent={(block) => setEditingBlockId(block.id)}
              onDelete={handleDelete}
              onChangeSize={handleChangeSize}
              reorder={reorderMobileBlocks}
            />
          )}

          {error ? (
            <Typography level="body-sm" color="danger" style={{ marginTop: 12 }}>
              {error}
            </Typography>
          ) : null}
        </ScrollView>

        <Box
          style={{
            padding: 16,
            paddingBottom: insets.bottom + 16,
            flexShrink: 0,
          }}
        >
          <Button color="primary" fullWidth disabled={saving} onPress={onSave}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </Box>
      </Box>

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
    </Modal>
  );
}
