import TabBar from "@components/Tabs/TabBar";
import { UserBar } from "@components/User/UserBar";
import { useAppStore } from "@hooks/useStores";
import { shouldShowVoiceUserBarPill } from "@utils/layout";
import { observer } from "mobx-react-lite";

export const VoiceUserBarOverlay = observer(() => {
  const app = useAppStore();

  if (!shouldShowVoiceUserBarPill(app.voice)) return null;

  return (
    <TabBar>
      <UserBar />
    </TabBar>
  );
});
