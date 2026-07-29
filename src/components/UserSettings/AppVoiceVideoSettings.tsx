import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import {
  SettingsScroll,
  SettingsSection,
  SettingsSelectRow,
  SettingsSliderRow,
  SettingsToggleRow,
} from "@components/UserSettings/SettingsField";
import { useSettingsOptionSheet } from "@hooks/useSettingsOptionSheet";
import { useAppStore } from "@hooks/useStores";
import type { VoiceMediaDevice } from "@stores/voice/webrtcBridge";
import { Radio, RadioGroup, Typography, useTheme } from "@mutualzz/ui-native";
import type { VoiceInputMode } from "@utils/voiceSettings.utils";
import { XIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { type MediaStream, RTCView, mediaDevices } from "react-native-webrtc";

const DEVICE_SHEET_PROPS = {
  layout: "center" as const,
  showCloseButton: false,
};

function deviceLabel(device: VoiceMediaDevice | undefined, fallback: string) {
  if (!device) return fallback;
  return device.label?.trim() || fallback;
}

export const AppVoiceVideoSettings = observer(() => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { theme } = useTheme();
  const openPicker = useSettingsOptionSheet();
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
    openPicker(
      sheetId,
      title,
      devices.map((device) => ({
        value: device.deviceId,
        label: deviceLabel(device, t("voice.unknownDevice")),
      })),
      selectedId ?? "",
      onSelect,
      DEVICE_SHEET_PROPS,
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
    // ignore
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
    <SettingsScroll>
      <SettingsSection
        title={t("voice.inputDevices")}
        description={t("voice.inputDevicesDescription")}
      >
        <SettingsSelectRow
          title={t("voice.microphone")}
          value={deviceLabel(
            selectedInput,
            inputs.length === 0
              ? t("voice.noMicrophones")
              : t("voice.selectMicrophone"),
          )}
          onPress={() => {
            if (inputs.length === 0) return;
            openDevicePicker(
              "voice-mic-picker",
              t("voice.microphone"),
              inputs.slice(),
              voice.currentInputDeviceId,
              (deviceId) => voice.setInputDeviceId(deviceId),
            );
          }}
        />
      </SettingsSection>

      <SettingsSection
        title={t("voice.speaker")}
        description={t("voice.speakerDescriptionMobile")}
      >
        <SettingsSliderRow
          title={t("voice.microphoneVolume")}
          value={voice.microphoneVolume}
          min={0}
          max={200}
          step={1}
          formatValueLabel={(value) => `${value}%`}
          onChange={(value) => voice.setMicrophoneVolume(value)}
        />
        <SettingsSliderRow
          title={t("voice.speakerVolume")}
          value={voice.speakerVolume}
          min={0}
          max={200}
          step={1}
          formatValueLabel={(value) => `${value}%`}
          onChange={(value) => voice.setSpeakerVolume(value)}
        />
        <Typography level="body-xs" textColor="muted">
          {t("voice.perUserVolumeDescription")}
        </Typography>
      </SettingsSection>

      <SettingsSection>
        <SettingsToggleRow
          title={t("voice.noiseSuppression")}
          description={t("voice.noiseSuppressionDescriptionMobile")}
          checked={voice.noiseSuppression}
          disabled={voice.noiseSuppressionPending}
          onChange={(checked) => {
            void voice.setNoiseSuppression(checked);
          }}
        />
        {voice.noiseSuppressionPending ? (
          <Typography level="body-xs" textColor="muted">
            {t("voice.noiseSuppressionApplying")}
          </Typography>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title={t("voice.inputMode")}
        description={t("voice.inputModeDescription")}
      >
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
        {voice.isPushToTalkMode ? (
          <Typography level="body-xs" textColor="muted">
            {t("voice.pushToTalkHint")}
          </Typography>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title={t("voice.voiceActivitySection")}
        description={t("voice.voiceActivityDescription")}
      >
        {voice.isPushToTalkMode ? (
          <Typography level="body-sm" textColor="muted">
            {t("voice.sensitivityPttOnly")}
          </Typography>
        ) : (
          <>
            <SettingsToggleRow
              title={t("voice.autoSensitivityShort")}
              checked={voice.voiceInputSensitivityAuto}
              onChange={(checked) => voice.setVoiceInputSensitivityAuto(checked)}
            />
            {!voice.voiceInputSensitivityAuto ? (
              <SettingsSliderRow
                title={t("voice.inputSensitivity")}
                value={voice.voiceInputSensitivity}
                min={0}
                max={100}
                step={1}
                formatValueLabel={(value) =>
                  t("voice.sensitivityPercent", { value })
                }
                onChange={(value) => voice.setVoiceInputSensitivity(value)}
              />
            ) : null}
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title={t("voice.camera")}
        description={t("voice.cameraDescription")}
      >
        <SettingsSelectRow
          title={t("voice.camera")}
          value={deviceLabel(
            selectedCamera,
            cameras.length === 0
              ? t("voice.noCameras")
              : t("voice.selectCamera"),
          )}
          onPress={() => {
            if (cameras.length === 0) return;
            openDevicePicker(
              "voice-camera-picker",
              t("voice.camera"),
              cameras.slice(),
              voice.currentCameraDeviceId,
              (deviceId) => voice.setCameraDeviceId(deviceId),
            );
          }}
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
            <View style={{ width: "100%", height: "100%" }}>
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
            </View>
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
      </SettingsSection>
    </SettingsScroll>
  );
});
