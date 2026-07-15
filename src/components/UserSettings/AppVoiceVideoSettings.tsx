import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import type { VoiceMediaDevice } from "@stores/voice/webrtcBridge";
import { Box, Checkbox, Radio, RadioGroup, Slider, Switch, Typography, useTheme } from "@mutualzz/ui-native";
import type { VoiceInputMode } from "@utils/voiceSettings.utils";
import { CaretRightIcon, CheckIcon, XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { type MediaStream, RTCView, mediaDevices } from "react-native-webrtc";

function deviceLabel(device: VoiceMediaDevice | undefined, fallback: string) {
  if (!device) return fallback;
  return device.label?.trim() || fallback;
}

function DevicePickerRow({
  label,
  value,
  placeholder,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 10,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography level="body-xs" textColor="muted">
          {label}
        </Typography>
        <Typography level="body-sm" truncate="single">
          {value || placeholder}
        </Typography>
      </Box>
      <CaretRightIcon
        size={16}
        color={theme.typography.colors.muted}
        weight="bold"
      />
    </Pressable>
  );
}

function DevicePickerContent({
  title,
  devices,
  selectedId,
  sheetId,
  onSelect,
}: {
  title: string;
  devices: VoiceMediaDevice[];
  selectedId: string | null;
  sheetId: string;
  onSelect: (deviceId: string) => void;
}) {
  const { t } = useTranslation("settings");
  const { theme } = useTheme();
  const app = useAppStore();
  const { closeSheet } = useSheet();

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 4 : 2}
      style={{
        width: "100%",
        maxWidth: 320,
        borderRadius: 16,
        padding: 8,
        gap: 2,
      }}
    >
      <Typography
        level="body-md"
        weight={700}
        style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      >
        {title}
      </Typography>

      {devices.length === 0 && (
        <Typography
          level="body-sm"
          textColor="muted"
          style={{ paddingHorizontal: 12, paddingBottom: 8 }}
        >
          {t("voice.noDevices")}
        </Typography>
      )}

      {devices.map((device) => {
        const active = device.deviceId === selectedId;

        return (
          <Pressable
            key={device.deviceId}
            onPress={() => {
              onSelect(device.deviceId);
              closeSheet(sheetId);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: active
                ? `${theme.colors.primary}18`
                : undefined,
            }}
          >
            <Typography
              level="body-sm"
              weight={active ? 600 : undefined}
              style={{ flex: 1 }}
              truncate="single"
            >
              {deviceLabel(device, t("voice.unknownDevice"))}
            </Typography>
            {active && (
              <CheckIcon
                size={16}
                weight="bold"
                color={theme.colors.success}
              />
            )}
          </Pressable>
        );
      })}
    </Paper>
  );
}

export const AppVoiceVideoSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { theme } = useTheme();
  const { openSheet } = useSheet();
  const voice = app.voice;

  const [testingCamera, setTestingCamera] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);

  const inputs = voice.inputs;
  const cameras = voice.cameras;

  const selectedInput = inputs.find(
    (device) => device.deviceId === voice.currentInputDeviceId,
  );
  const selectedCamera = cameras.find(
    (device) => device.deviceId === voice.currentCameraDeviceId,
  );

  const fallbackCameraId =
    selectedCamera?.deviceId ?? cameras[0]?.deviceId ?? null;

  const openDevicePicker = (
    sheetId: string,
    title: string,
    devices: VoiceMediaDevice[],
    selectedId: string | null,
    onSelect: (deviceId: string) => void,
  ) => {
    openSheet(
      sheetId,
      <DevicePickerContent
        title={title}
        devices={devices}
        selectedId={selectedId}
        sheetId={sheetId}
        onSelect={onSelect}
      />,
      { layout: "center", showCloseButton: false },
    );
  };

  useEffect(() => {
    void voice.setupDevices(true);
  }, [voice]);

  useEffect(() => {
    if (!testingCamera) {
      setTestStream(null);
      return;
    }

    let active = true;
    let stream: MediaStream | null = null;

    const startTest = async () => {
      try {
        const nextStream = await mediaDevices.getUserMedia({
          audio: false,
          video: fallbackCameraId ? { deviceId: fallbackCameraId } : true,
        });

        if (!active) {
          nextStream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {
              // ingore
            }
          });
          return;
        }

        stream = nextStream;
        setTestStream(nextStream);
      } catch {
        if (active) setTestingCamera(false);
      }
    };

    void startTest();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // ignore
          }
        });
      }
      setTestStream(null);
    };
  }, [testingCamera, fallbackCameraId]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
        gap: 16,
      }}
    >
      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 4,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("voice.inputDevices")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("voice.inputDevicesDescription")}
        </Typography>

        <DevicePickerRow
          label={t("voice.microphone")}
          value={deviceLabel(selectedInput, "")}
          placeholder={
            inputs.length === 0
              ? t("voice.noMicrophones")
              : t("voice.selectMicrophone")
          }
          disabled={inputs.length === 0}
          onPress={() =>
            openDevicePicker(
              "voice-mic-picker",
              t("voice.microphone"),
              inputs.slice(),
              voice.currentInputDeviceId,
              (deviceId) => voice.setInputDeviceId(deviceId),
            )
          }
        />
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Box style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography level="body-md" weight={700}>
              {t("voice.noiseSuppression")}
            </Typography>
            <Typography level="body-sm" textColor="muted">
              {t("voice.noiseSuppressionDescriptionMobile")}
            </Typography>
            {voice.noiseSuppressionPending && (
              <Typography level="body-xs" textColor="muted">
                {t("voice.noiseSuppressionApplying")}
              </Typography>
            )}
          </Box>
          <Switch
            checked={voice.noiseSuppression}
            disabled={voice.noiseSuppressionPending}
            color="primary"
            onChange={(checked) => {
              void voice.setNoiseSuppression(checked);
            }}
          />
        </Box>
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("voice.inputMode")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("voice.inputModeDescription")}
        </Typography>
        <RadioGroup
          value={voice.voiceInputMode}
          color="primary"
          variant="outlined"
          size="sm"
          spacing="sm"
          onChange={(value) => {
            if (value === "voice_activity" || value === "push_to_talk") {
              voice.setVoiceInputMode(value as VoiceInputMode);
            }
          }}
        >
          <Radio value="voice_activity" label={t("voice.voiceActivityShort")} />
          <Radio value="push_to_talk" label={t("voice.pushToTalkShort")} />
        </RadioGroup>
        {voice.isPushToTalkMode && (
          <Typography level="body-xs" textColor="muted">
            {t("voice.pushToTalkHint")}
          </Typography>
        )}
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("voice.voiceActivitySection")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("voice.voiceActivityDescription")}
        </Typography>
        {voice.isPushToTalkMode ? (
          <Typography level="body-sm" textColor="muted">
            {t("voice.sensitivityPttOnly")}
          </Typography>
        ) : (
          <>
            <Checkbox
              checked={voice.voiceInputSensitivityAuto}
              color="primary"
              variant="outlined"
              size="sm"
              onChange={(checked) =>
                voice.setVoiceInputSensitivityAuto(checked)
              }
              label={t("voice.autoSensitivityShort")}
            />
            {!voice.voiceInputSensitivityAuto && (
              <Box style={{ gap: 4 }}>
                <Typography level="body-xs" textColor="muted">
                  {t("voice.sensitivityPercent", {
                    value: voice.voiceInputSensitivity,
                  })}
                </Typography>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={voice.voiceInputSensitivity}
                  onChange={(value) =>
                    voice.setVoiceInputSensitivity(
                      Array.isArray(value) ? value[0] : value,
                    )
                  }
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 4,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("voice.perUserVolume")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("voice.perUserVolumeDescription")}
        </Typography>
      </Paper>

      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-md" weight={700}>
          {t("voice.camera")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("voice.cameraDescription")}
        </Typography>

        <DevicePickerRow
          label={t("voice.camera")}
          value={deviceLabel(selectedCamera, "")}
          placeholder={
            cameras.length === 0
              ? t("voice.noCameras")
              : t("voice.selectCamera")
          }
          disabled={cameras.length === 0}
          onPress={() =>
            openDevicePicker(
              "voice-camera-picker",
              t("voice.camera"),
              cameras.slice(),
              voice.currentCameraDeviceId,
              (deviceId) => voice.setCameraDeviceId(deviceId),
            )
          }
        />

        <View
          style={{
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#000",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {testingCamera && testStream ? (
            <>
              <RTCView
                streamURL={testStream.toURL()}
                style={{ width: "100%", height: "100%" }}
                objectFit="cover"
                mirror
              />
              <IconButton
                padding={8}
                color="danger"
                accessibilityLabel={t("voice.stopCameraTest")}
                onPress={() => setTestingCamera(false)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: `${theme.colors.danger}cc`,
                }}
              >
                <XIcon size={16} weight="bold" color="#fff" />
              </IconButton>
            </>
          ) : (
            <Button
              color="neutral"
              onPress={() => {
                if (!voice.currentCameraDeviceId && fallbackCameraId) {
                  voice.setCameraDeviceId(fallbackCameraId);
                }
                setTestingCamera(true);
              }}
              disabled={cameras.length === 0}
            >
              {t("voice.testCameraShort")}
            </Button>
          )}
        </View>
      </Paper>
    </ScrollView>
  );
});
