import { AppLogo } from "@components/Logo/AppLogo";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { IconButton, Stack } from "@mutualzz/ui-native";
import { PaintBrushIcon, UserIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";

export const FeedSidebar = observer(() => {
  const app = useAppStore();
  const { navigate } = useAppNavigation();
  const account = app.account;

  return (
    <Stack
      style={{
        width: 72,
        alignItems: "center",
        paddingVertical: 16,
        gap: 16,
      }}
    >
      <AppLogo size={40} />
      {account && (
        <>
          <IconButton
            variant="plain"
            onPress={() => navigate(`/users/${account.username}`)}
          >
            <UserIcon size={22} weight="fill" />
          </IconButton>
          <IconButton
            variant="plain"
            onPress={() => navigate("/(tabs)/settings/profile-editor")}
          >
            <PaintBrushIcon size={22} weight="fill" />
          </IconButton>
        </>
      )}
    </Stack>
  );
});
