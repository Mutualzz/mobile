import {
  WhatsNewSheet,
  WHATS_NEW_SHEET_ID,
} from "@components/Sheets/WhatsNewSheet";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { APIChangelog } from "@mutualzz/types";
import { MOBILE_APP_VERSION } from "@utils/appVersion";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

export const ChangelogPrompt = observer(() => {
  const app = useAppStore();
  const { openSheet, isSheetOpen } = useSheet();
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
        if (isSheetOpen(WHATS_NEW_SHEET_ID)) return;

        shownIdsRef.current.add(changelog.id);

        openSheet(
          WHATS_NEW_SHEET_ID,
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
