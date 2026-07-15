import { SheetHost } from "@contexts/Sheet.context";
import { BottomSheetModalProvider } from "@expo/ui/community/bottom-sheet";
import type { PropsWithChildren } from "react";

export function SheetHostBootstrap({
  id,
  priority = 0,
  children,
}: PropsWithChildren<{
  id: string;
  priority?: number;
}>) {
  return (
    <BottomSheetModalProvider>
      {children}
      <SheetHost id={id} priority={priority} />
    </BottomSheetModalProvider>
  );
}
