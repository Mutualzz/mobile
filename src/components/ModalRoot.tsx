import { useModal } from "@hooks/useModal";
import { Modal, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

export const ModalRoot = observer(() => {
    const { theme } = useTheme();
    const { modals, closeModal } = useModal();

    if (modals.length === 0) return null;

    return (
        <>
            {modals.map((modal, idx) => (
                <Modal
                    {...modal.props}
                    key={modal.id}
                    open={true}
                    onClose={() => closeModal(modal.id)}
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
