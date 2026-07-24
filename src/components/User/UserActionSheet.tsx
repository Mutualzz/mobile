import { Button } from "@components/Button";
import { useUserActionMenu } from "@components/User/useUserActionMenu";
import { Box, ButtonGroup, Divider, Sheet, Slider, Switch, Typography } from "@mutualzz/ui-native";
import type { User } from "@stores/objects/User";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  user: User;
  visible?: boolean;
  onClose: () => void;
  insideDMs?: boolean;
  hideMessage?: boolean;
  onNavigate?: () => void;
  embedded?: boolean;
}

export const UserActionSheet = observer(
  ({
    user,
    visible = true,
    onClose,
    insideDMs = false,
    hideMessage = false,
    onNavigate,
    embedded = false,
  }: Props) => {
    const { t } = useTranslation("chat");
    const {
      items,
      inSameVoiceChannel,
      userVoiceMuted,
      userVoiceVolume,
      setUserVoiceVolume,
      toggleUserVoiceMuted,
    } = useUserActionMenu({
      user,
      insideDMs,
      hideMessage,
      onNavigate,
      onClose,
    });

    const content = (
      <View style={{ width: "100%" }}>
        <View onStartShouldSetResponder={() => true}>
          <Box
            style={{
              width: "100%",
              padding: 16,
              gap: 8,
            }}
          >
            <Box style={{ gap: 8 }}>
              <Box
                style={{ alignItems: "center", paddingVertical: 8, gap: 4 }}
              >
                <Typography level="body-md" weight={700} truncate="single">
                  {user.displayName}
                </Typography>
                <Typography
                  level="body-xs"
                  textColor="muted"
                  truncate="single"
                >
                  @{user.username}
                </Typography>
              </Box>

              <Divider lineColor="muted" />

              <ButtonGroup
                orientation="vertical"
                variant="plain"
                fullWidth
                horizontalAlign="left"
                spacing={0.5}
              >
                {items.map((item) => (
                  <Button
                    key={item.key}
                    fullWidth
                    padding={12}
                    disabled={item.disabled}
                    startDecorator={item.icon}
                    onPress={item.onPress}
                  >
                    {item.label}
                  </Button>
                ))}

                {!hideMessage && inSameVoiceChannel && (
                  <>
                    <Divider lineColor="muted" />
                    <Box style={{ gap: 8, paddingHorizontal: 4 }}>
                      <Box
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography level="body-sm">
                          {t("voice.controls.muteUser")}
                        </Typography>
                        <Switch
                          checked={userVoiceMuted}
                          onChange={toggleUserVoiceMuted}
                        />
                      </Box>
                      <Box style={{ gap: 6 }}>
                        <Box
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography level="body-sm">
                            {t("voice.controls.userVolume")}
                          </Typography>
                          <Typography level="body-xs" textColor="muted">
                            {userVoiceVolume}%
                          </Typography>
                        </Box>
                        <Slider
                          min={0}
                          max={200}
                          value={userVoiceVolume}
                          disabled={userVoiceMuted}
                          onChange={(value) =>
                            setUserVoiceVolume(
                              Array.isArray(value) ? (value[0] ?? 0) : value,
                            )
                          }
                        />
                      </Box>
                    </Box>
                  </>
                )}
              </ButtonGroup>
            </Box>
          </Box>
        </View>
      </View>
    );

    if (embedded) return content;

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
        enableDynamicSizing
      >
        {content}
      </Sheet>
    );
  },
);
