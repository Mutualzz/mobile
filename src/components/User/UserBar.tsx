import { CustomStatusSheet } from "@components/UserSettings/CustomStatusSheet";
import { AccountMenuSheet } from "@components/User/AccountMenuSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

export const UserBar = observer(() => {
  const app = useAppStore();
  const account = app.account;
  const [statusOpen, setStatusOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!account) return null;

  const customStatus = app.customStatus.effectiveText;

  return (
    <>
      <Pressable
        onPress={() => setMenuOpen(true)}
        onLongPress={() => setStatusOpen(true)}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          paddingHorizontal: 12,
        }}
      >
        <UserAvatar user={account} size="lg" badge showInvisible />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" numberOfLines={1}>
            {account.displayName}
          </Typography>
          <Typography level="body-xs" textColor="muted" numberOfLines={1}>
            {customStatus || `@${account.username}`}
          </Typography>
        </Box>
      </Pressable>

      <AccountMenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <CustomStatusSheet
        visible={statusOpen}
        onClose={() => setStatusOpen(false)}
      />
    </>
  );
});
