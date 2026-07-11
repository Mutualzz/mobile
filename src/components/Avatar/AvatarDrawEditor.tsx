import {
  drawCanvasPngDataUri,
  exportDrawCanvasToBase64,
} from "@components/Avatar/drawCanvasExport";
import { IconButton } from "@components/IconButton";
import {
  ProfileDrawCanvas,
  renderStrokesToSvg,
  type DrawCanvasState,
} from "@components/Profile/widgets/editor/ProfileDrawCanvas";
import { AVATAR_DRAW_CANVAS_SIZE } from "@components/Profile/widgets/editor/drawCanvas.constants";
import { useAppStore } from "@hooks/useStores";
import type { APIPrivateUser } from "@mutualzz/types";
import { Box, Modal, Typography, useTheme } from "@mutualzz/ui-native";
import { ArrowLeftIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUploaded?: () => void;
  initialDraftId?: string | null;
}

export const AvatarDrawEditor = observer(
  ({ visible, onClose, onUploaded, initialDraftId = null }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation("settings");
    const account = app.account;

    const [canvasKey, setCanvasKey] = useState(0);
    const [initialState, setInitialState] = useState<DrawCanvasState | null>(
      null,
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!visible) return;

      if (initialDraftId) {
        const draft = app.drafts.getAvatarDraft(initialDraftId);
        setInitialState(draft?.state ?? null);
      } else {
        setInitialState(null);
      }
      setCanvasKey((value) => value + 1);
    }, [visible, initialDraftId, app.drafts]);

    if (!account) return null;

    const uploadDrawnAvatar = async (state: DrawCanvasState) => {
      if (state.strokes.length === 0) {
        setError(t("profile.avatar.draw.drawBeforeSaving"));
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const base64 = await exportDrawCanvasToBase64(state, {
          circular: true,
        });
        if (!base64) {
          throw new Error(t("profile.avatar.draw.failedExportDrawing"));
        }

        const formData = new FormData();
        formData.append("avatar", {
          uri: drawCanvasPngDataUri(base64),
          type: "image/png",
          name: "avatar.png",
        } as unknown as Blob);

        const updated = await app.rest.patchFormData<APIPrivateUser>(
          "@me",
          formData,
        );
        account.update(updated);
        onUploaded?.();
        handleClose();
      } catch (e) {
        setError(getErrorMessage(e, t("profile.failedUploadAvatar")));
      } finally {
        setSaving(false);
      }
    };

    const handleClose = () => {
      setError(null);
      setInitialState(null);
      setCanvasKey((value) => value + 1);
      onClose();
    };

    return (
      <Modal
        open={visible}
        onClose={handleClose}
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
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <IconButton
              padding={6}
              onPress={handleClose}
              accessibilityLabel={t("profile.avatar.draw.back")}
              disabled={saving}
            >
              <ArrowLeftIcon size={20} />
            </IconButton>
            <Typography level="title-md" weight="bold">
              {t("profile.avatar.draw.drawAvatarTitle")}
            </Typography>
          </Box>

          <Box
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <ProfileDrawCanvas
              key={canvasKey}
              initial={initialState}
              canvasSize={AVATAR_DRAW_CANVAS_SIZE}
              maskShape="circle"
              defaultBackgroundColor="#ffffff"
              saveLabel={
                saving
                  ? t("expressions.uploading")
                  : t("profile.avatar.draw.saveAvatar")
              }
              disableActions={saving}
              onCancel={handleClose}
              onSave={(state) => {
                void uploadDrawnAvatar(state);
              }}
              onSaveDraft={(state) => {
                app.drafts.saveAvatarDraft(renderStrokesToSvg(state), state);
              }}
            />

            {error && (
              <Typography level="body-sm" color="danger" variant="plain">
                {error}
              </Typography>
            )}
          </Box>
        </Box>
      </Modal>
    );
  },
);

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}
