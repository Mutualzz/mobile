import { ModalRoot } from "@components/ModalRoot";
import type { ModalProps } from "@mutualzz/ui-native";
import {
    createContext,
    useCallback,
    useState,
    type PropsWithChildren,
    type ReactNode,
} from "react";

interface ModalStackItem {
    key: string;
    id: string;
    content: ReactNode;
    props?: Partial<ModalProps>;
}

interface ModalContextProps {
    modals: ModalStackItem[];
    openModal: (
        id: string,
        children: ReactNode,
        modalProps?: Partial<ModalProps>,
    ) => void;
    closeModal: (id?: string) => void;
    closeAllModals: () => void;
    isModalOpen: (id: string) => boolean;
}

export const ModalContext = createContext<ModalContextProps>({
    modals: [],
    openModal: () => {
        return;
    },
    closeModal: () => {
        return;
    },
    isModalOpen: () => false,
    closeAllModals: () => {
        return;
    },
});

export const ModalProvider = ({ children }: PropsWithChildren) => {
    const [modals, setModals] = useState<ModalStackItem[]>([]);

    const openModal = useCallback(
        (id: string, content: ReactNode, props: Partial<ModalProps> = {}) => {
            setModals((prev) => [
                ...prev.filter((modal) => modal.id !== id),
                {
                    key: `modal-${id}-${Date.now()}`,
                    id,
                    content,
                    props,
                },
            ]);
        },
        [],
    );

    const closeModal = useCallback((id?: string) => {
        setModals(
            (prev) =>
                id
                    ? prev.filter((modal) => modal.id !== id)
                    : prev.slice(0, -1), // close topmost if no id
        );
    }, []);

    const closeAllModals = useCallback(() => {
        setModals([]);
    }, []);

    const isModalOpen = useCallback(
        (id: string) => modals.some((modal) => modal.id === id),
        [modals],
    );

    const contextValue: ModalContextProps = {
        modals,
        openModal,
        closeModal,
        isModalOpen,
        closeAllModals,
    };

    return (
        <ModalContext.Provider value={contextValue}>
            {children}
            <ModalRoot />
        </ModalContext.Provider>
    );
};
