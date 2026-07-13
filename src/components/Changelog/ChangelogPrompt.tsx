import {
  WhatsNewSheet,
  WHATS_NEW_MODAL_ID,
} from "@components/Modals/WhatsNewSheet";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { APIChangelog } from "@mutualzz/types";
import { MOBILE_APP_VERSION } from "@utils/appVersion";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

export const ChangelogPrompt = observer(() => {
  const app = useAppStore();
  const { openModal, isModalOpen } = useModal();
  const shownIdsRef = useRef(new Set<string>());
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!app.isGatewayReady || !app.token) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;

    void (async () => {
      try {
        const changelog = await app.rest.get<APIChangelog | null>(
          "/changelogs/unseen",
          {
            platform: "mobile",
            version: MOBILE_APP_VERSION,
          },
        );

        if (!changelog) return;
        if (shownIdsRef.current.has(changelog.id)) return;
        if (isModalOpen(WHATS_NEW_MODAL_ID)) return;

        shownIdsRef.current.add(changelog.id);

        openModal(
          WHATS_NEW_MODAL_ID,
          <WhatsNewSheet
            changelog={changelog}
            onAck={async () => {
              await app.rest.post(`/changelogs/${changelog.id}/ack`);
            }}
          />,
        );
      } catch {
        return;
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [app.isGatewayReady, app.token]);

  return null;
});
