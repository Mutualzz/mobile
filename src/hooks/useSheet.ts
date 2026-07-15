import { SheetContext } from "@contexts/Sheet.context";
import { useContext } from "react";

export function useSheet() {
    const ctx = useContext(SheetContext);
    if (!ctx) throw new Error("useSheet must be used within a SheetProvider");
    return ctx;
}
