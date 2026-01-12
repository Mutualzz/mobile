import { ModalContext } from "@contexts/Modal.context";
import { useContext } from "react";

export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx)
        throw new Error("useModalContext must be used within a ModalProvider");
    return ctx;
}
