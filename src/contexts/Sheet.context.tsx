import type { SheetProps } from "@mutualzz/ui-native";
import { Sheet } from "@mutualzz/ui-native";
import { useNavigation } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";

interface SheetStackItem {
  key: string;
  id: string;
  content: ReactNode;
  props?: Partial<SheetProps>;
}

interface SheetHostEntry {
  id: string;
  priority: number;
  focused: boolean;
}

interface SheetContextProps {
  sheets: SheetStackItem[];
  closingIds: Set<string>;
  openSheet: (
    id: string,
    children: ReactNode,
    sheetProps?: Partial<SheetProps>,
  ) => void;
  closeSheet: (id?: string) => void;
  finalizeClose: (id: string) => void;
  closeAllSheets: () => void;
  isSheetOpen: (id: string) => boolean;
  activeHostId: string;
  setHostState: (id: string, priority: number, focused: boolean) => void;
  removeHost: (id: string) => void;
}

export const SheetContext = createContext<SheetContextProps>({
  sheets: [],
  closingIds: new Set(),
  openSheet: () => {
    return;
  },
  closeSheet: () => {
    return;
  },
  finalizeClose: () => {
    return;
  },
  isSheetOpen: () => false,
  closeAllSheets: () => {
    return;
  },
  activeHostId: "root",
  setHostState: () => {
    return;
  },
  removeHost: () => {
    return;
  },
});

const FINALIZE_CLOSE_FALLBACK_MS = 750;

function resolveActiveHostId(hosts: SheetHostEntry[]): string {
  const focused = hosts.filter((host) => host.focused);
  if (focused.length === 0) {
    if (hosts.length === 0) return "tabs";
    return hosts.reduce((best, host) =>
      host.priority >= best.priority ? host : best,
    ).id;
  }
  return focused.reduce((best, host) =>
    host.priority >= best.priority ? host : best,
  ).id;
}

export const SheetProvider = ({ children }: PropsWithChildren) => {
  const [sheets, setSheets] = useState<SheetStackItem[]>([]);
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());
  const [hosts, setHosts] = useState<SheetHostEntry[]>([]);
  const sheetsRef = useRef(sheets);
  sheetsRef.current = sheets;

  const activeHostId = useMemo(() => resolveActiveHostId(hosts), [hosts]);

  const setHostState = useCallback(
    (id: string, priority: number, focused: boolean) => {
      setHosts((prev) => {
        const without = prev.filter((host) => host.id !== id);
        return [...without, { id, priority, focused }];
      });
    },
    [],
  );

  const removeHost = useCallback((id: string) => {
    setHosts((prev) => prev.filter((host) => host.id !== id));
  }, []);

  const finalizeClose = useCallback((id: string) => {
    setSheets((prev) => prev.filter((sheet) => sheet.id !== id));
    setClosingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (closingIds.size === 0) return;

    const timers = [...closingIds].map((id) =>
      setTimeout(() => finalizeClose(id), FINALIZE_CLOSE_FALLBACK_MS),
    );

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [closingIds, finalizeClose]);

  const openSheet = useCallback(
    (id: string, content: ReactNode, props: Partial<SheetProps> = {}) => {
      setClosingIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSheets((prev) => [
        ...prev.filter((sheet) => sheet.id !== id),
        {
          key: `sheet-${id}-${Date.now()}`,
          id,
          content,
          props,
        },
      ]);
    },
    [],
  );

  const closeSheet = useCallback((id?: string) => {
    const targetId =
      id ?? sheetsRef.current[sheetsRef.current.length - 1]?.id;
    if (!targetId) return;

    setClosingIds((closing) => {
      if (closing.has(targetId)) return closing;
      const next = new Set(closing);
      next.add(targetId);
      return next;
    });
  }, []);

  const closeAllSheets = useCallback(() => {
    const ids = sheetsRef.current.map((sheet) => sheet.id);
    if (ids.length === 0) return;
    setClosingIds(new Set(ids));
  }, []);

  const isSheetOpen = useCallback(
    (id: string) =>
      sheets.some((sheet) => sheet.id === id) && !closingIds.has(id),
    [closingIds, sheets],
  );

  const contextValue = useMemo<SheetContextProps>(
    () => ({
      sheets,
      closingIds,
      openSheet,
      closeSheet,
      finalizeClose,
      isSheetOpen,
      closeAllSheets,
      activeHostId,
      setHostState,
      removeHost,
    }),
    [
      sheets,
      closingIds,
      openSheet,
      closeSheet,
      finalizeClose,
      isSheetOpen,
      closeAllSheets,
      activeHostId,
      setHostState,
      removeHost,
    ],
  );

  return (
    <SheetContext.Provider value={contextValue}>{children}</SheetContext.Provider>
  );
};

export function SheetHost({
  id,
  priority = 0,
}: {
  id: string;
  priority?: number;
}) {
  const {
    sheets,
    closingIds,
    closeSheet,
    finalizeClose,
    activeHostId,
    setHostState,
    removeHost,
  } = useContext(SheetContext);
  const navigation = useNavigation();

  useEffect(() => {
    const sync = (focused: boolean) => setHostState(id, priority, focused);
    sync(navigation.isFocused());
    const unsubFocus = navigation.addListener("focus", () => sync(true));
    const unsubBlur = navigation.addListener("blur", () => sync(false));
    return () => {
      unsubFocus();
      unsubBlur();
      removeHost(id);
    };
  }, [id, navigation, priority, removeHost, setHostState]);

  if (activeHostId !== id) return null;

  return (
    <>
      {sheets.map((sheet) => (
        <Sheet
          {...sheet.props}
          key={sheet.key}
          open={!closingIds.has(sheet.id)}
          onClose={() => closeSheet(sheet.id)}
          onExited={() => finalizeClose(sheet.id)}
          showCloseButton={sheet.props?.showCloseButton ?? false}
        >
          {sheet.content}
        </Sheet>
      ))}
    </>
  );
}
