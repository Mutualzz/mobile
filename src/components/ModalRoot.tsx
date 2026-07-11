import { useModal } from "@hooks/useModal";
import { Modal, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

export const ModalRoot = observer(() => {
  const { theme } = useTheme();
  const { modals, closingIds, closeModal, finalizeClose } = useModal();

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal, idx) => (
        <Modal
          {...modal.props}
          key={modal.key}
          open={!closingIds.has(modal.id)}
          // Backdrop / back / swipe — mark closing so open becomes false.
          onClose={() => closeModal(modal.id)}
          // After exit animation — remove from stack (prevents invisible blockers).
          onExited={() => finalizeClose(modal.id)}
          style={{
            zIndex: theme.zIndex.modal + idx,
            ...(modal.props?.style as any),
          }}
        >
          {modal.content}
        </Modal>
      ))}
    </>
  );
});
