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
    closingIds: Set<string>;
    openModal: (
        id: string,
        children: ReactNode,
        modalProps?: Partial<ModalProps>,
    ) => void;
    closeModal: (id?: string) => void;
    finalizeClose: (id: string) => void;
    closeAllModals: () => void;
    isModalOpen: (id: string) => boolean;
}

export const ModalContext = createContext<ModalContextProps>({
    modals: [],
    closingIds: new Set(),
    openModal: () => {
        return;
    },
    closeModal: () => {
        return;
    },
    finalizeClose: () => {
        return;
    },
    isModalOpen: () => false,
    closeAllModals: () => {
        return;
    },
});

export const ModalProvider = ({ children }: PropsWithChildren) => {
    const [modals, setModals] = useState<ModalStackItem[]>([]);
    const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

    const openModal = useCallback(
        (id: string, content: ReactNode, props: Partial<ModalProps> = {}) => {
            setClosingIds((prev) => {
                if (!prev.has(id)) return prev;
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
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
        setModals((prev) => {
            const targetId = id ?? prev[prev.length - 1]?.id;
            if (!targetId) return prev;

            setClosingIds((closing) => {
                const next = new Set(closing);
                next.add(targetId);
                return next;
            });

            return prev;
        });
    }, []);

    const finalizeClose = useCallback((id: string) => {
        setModals((prev) => prev.filter((modal) => modal.id !== id));
        setClosingIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const closeAllModals = useCallback(() => {
        setModals((prev) => {
            if (prev.length === 0) return prev;
            setClosingIds(new Set(prev.map((modal) => modal.id)));
            return prev;
        });
    }, []);

    const isModalOpen = useCallback(
        (id: string) =>
            modals.some((modal) => modal.id === id) && !closingIds.has(id),
        [closingIds, modals],
    );

    const contextValue: ModalContextProps = {
        modals,
        closingIds,
        openModal,
        closeModal,
        finalizeClose,
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
