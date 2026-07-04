import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { FLOATING_USER_BAR_HEIGHT } from "@utils/layout";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
}

const TabBar = ({ children }: Props) => {
  const app = useAppStore();
  const insets = useSafeAreaInsets();

  return (
    <Paper
      color="neutral"
      elevation={0}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingLeft: insets.left + 16,
        paddingRight: insets.right + 16,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 8,
        borderRadius: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      <Paper
        elevation={app.settings?.preferEmbossed ? 5 : 3}
        color="neutral"
        style={{
          width: "100%",
          maxWidth: 420,
          minHeight: FLOATING_USER_BAR_HEIGHT,
          borderRadius: 16,
          justifyContent: "center",
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderTopWidth: 0,
          borderBottomWidth: 0,
        }}
      >
        {children}
      </Paper>
    </Paper>
  );
};

export default observer(TabBar);
