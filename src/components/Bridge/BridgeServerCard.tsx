import { Paper } from "@components/Paper";
import { useBridgeServerLabel } from "@hooks/useBridgeInventory";
import { useAppStore } from "@hooks/useStores";
import { type BridgeServerStatus, tpsColor } from "@mutualzz/client";
import { Box, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const Stat = ({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: "success" | "warning" | "danger";
}) => (
  <Box style={{ flex: 1, alignItems: "center", minWidth: 0 }}>
    <Typography level="body-sm" weight="bold" color={color}>
      {value}
    </Typography>
    <Typography level="body-xs" textColor="muted">
      {label}
    </Typography>
  </Box>
);

export const BridgeServerCard = observer(
  ({
    bridgeId,
    statuses,
  }: {
    bridgeId: string;
    statuses: BridgeServerStatus[];
  }) => {
    const app = useAppStore();
    const { t } = useTranslation("settings");
    const labelFor = useBridgeServerLabel(bridgeId);
    const players = app.bridgeChat.playersFor(bridgeId);

    if (statuses.length === 0) return null;

    const sorted = [...statuses].sort((first, second) =>
      labelFor(first.serverId).localeCompare(labelFor(second.serverId)),
    );

    return (
      <Box style={{ gap: 8 }}>
        {sorted.map((status) => {
          const online = players.filter(
            (player) => player.serverId === status.serverId,
          ).length;

          return (
            <Paper
              key={status.serverId}
              elevation={app.settings?.preferEmbossed ? 3 : 1}
              style={{ borderRadius: 10, padding: 10, gap: 10 }}
            >
              <Box style={{ gap: 2, minWidth: 0 }}>
                <Box
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Typography level="body-sm" color={tpsColor(status.tps)}>
                    ●
                  </Typography>
                  <Typography
                    level="body-sm"
                    weight="bold"
                    truncate="single"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    {labelFor(status.serverId)}
                  </Typography>
                  <Typography level="body-xs" textColor="muted">
                    {status.version}
                  </Typography>
                </Box>
                {!!status.motd && (
                  <Typography
                    level="body-xs"
                    textColor="muted"
                    truncate="single"
                  >
                    {status.motd}
                  </Typography>
                )}
              </Box>

              <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  borderRadius: 8,
                  paddingVertical: 8,
                  flexDirection: "row",
                }}
              >
                <Stat
                  value={`${online}/${status.maxPlayers}`}
                  label={t("minecraftBridge.serverCardPlayersLabel")}
                />
                <Stat
                  value={status.tps.toFixed(1)}
                  label="TPS"
                  color={tpsColor(status.tps)}
                />
                <Stat value={`${Math.round(status.mspt)} ms`} label="MSPT" />
              </Paper>
            </Paper>
          );
        })}
      </Box>
    );
  },
);
