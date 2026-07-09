import { Button } from "@components/Button";
import { IconButton } from "@components/IconButton";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import type { VoiceMediaDevice } from "@stores/voice/webrtcBridge";
import {
  Box,
  Checkbox,
  Modal,
  Radio,
  RadioGroup,
  Slider,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import type { VoiceInputMode } from "@utils/voiceSettings.utils";
import {
  CaretRightIcon,
  CheckIcon,
  XIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { MediaStream, RTCView, mediaDevices } from "react-native-webrtc";

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

function DevicePickerModal({
  title,
  devices,
  selectedId,
  open,
  onClose,
  onSelect,
}: {
  title: string;
  devices: VoiceMediaDevice[];
  selectedId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (deviceId: string) => void;
}) {
  const { theme } = useTheme();
  const app = useAppStore();

  return (
    <Modal open={open} onClose={onClose} layout="center" showCloseButton={false}>
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

        {devices.length === 0 ? (
          <Typography
            level="body-sm"
            textColor="muted"
            style={{ paddingHorizontal: 12, paddingBottom: 8 }}
          >
            No devices detected.
          </Typography>
        ) : null}

        {devices.map((device) => {
          const active = device.deviceId === selectedId;

          return (
            <Pressable
              key={device.deviceId}
              onPress={() => {
                onSelect(device.deviceId);
                onClose();
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
                {deviceLabel(device, "Unknown device")}
              </Typography>
              {active ? (
                <CheckIcon
                  size={16}
                  weight="bold"
                  color={theme.colors.success}
                />
              ) : null}
            </Pressable>
          );
        })}
      </Paper>
    </Modal>
  );
}

export const AppVoiceVideoSettings = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const voice = app.voice;

  const [micPickerOpen, setMicPickerOpen] = useState(false);
  const [cameraPickerOpen, setCameraPickerOpen] = useState(false);
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
            } catch {}
          });
          return;
        }

        stream = nextStream;
        setTestStream(nextStream);
      } catch (error) {
        console.error("Failed to start camera test:", error);
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
          } catch {}
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
          Input devices
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Choose which microphone to use in voice channels.
        </Typography>

        <DevicePickerRow
          label="Microphone"
          value={deviceLabel(selectedInput, "")}
          placeholder={
            inputs.length === 0
              ? "No microphones detected"
              : "Select a microphone"
          }
          disabled={inputs.length === 0}
          onPress={() => setMicPickerOpen(true)}
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
        <Typography level="body-md" weight={700}>
          Input mode
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Choose whether your microphone activates automatically or only while
          you hold the push-to-talk button in voice channels.
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
          <Radio value="voice_activity" label="Voice activity" />
          <Radio value="push_to_talk" label="Push to talk" />
        </RadioGroup>
        {voice.isPushToTalkMode ? (
          <Typography level="body-xs" textColor="muted">
            While in a voice channel, hold the microphone button in the user bar
            to transmit.
          </Typography>
        ) : null}
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
          Voice activity
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Your microphone only transmits while you are speaking. Adjust
          sensitivity if voice detection feels too sensitive or not sensitive
          enough.
        </Typography>
        {voice.isPushToTalkMode ? (
          <Typography level="body-sm" textColor="muted">
            Sensitivity settings apply only in voice activity mode.
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
              label="Automatic sensitivity"
            />
        {!voice.voiceInputSensitivityAuto ? (
          <Box style={{ gap: 4 }}>
            <Typography level="body-xs" textColor="muted">
              Sensitivity {voice.voiceInputSensitivity}%
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
        ) : null}
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
          Per-user volume
        </Typography>
        <Typography level="body-sm" textColor="muted">
          While in a voice channel, use the volume slider on each participant to
          adjust how loud they sound for you. These settings are saved on this
          device.
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
          Camera
        </Typography>
        <Typography level="body-sm" textColor="muted">
          Camera works in voice channels on mobile. Screen share remains
          desktop-only for now.
        </Typography>

        <DevicePickerRow
          label="Camera"
          value={deviceLabel(selectedCamera, "")}
          placeholder={
            cameras.length === 0 ? "No cameras detected" : "Select a camera"
          }
          disabled={cameras.length === 0}
          onPress={() => setCameraPickerOpen(true)}
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
                accessibilityLabel="Stop camera test"
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
              Test camera
            </Button>
          )}
        </View>
      </Paper>

      <DevicePickerModal
        title="Microphone"
        devices={inputs.slice()}
        selectedId={voice.currentInputDeviceId}
        open={micPickerOpen}
        onClose={() => setMicPickerOpen(false)}
        onSelect={(deviceId) => voice.setInputDeviceId(deviceId)}
      />

      <DevicePickerModal
        title="Camera"
        devices={cameras.slice()}
        selectedId={voice.currentCameraDeviceId}
        open={cameraPickerOpen}
        onClose={() => setCameraPickerOpen(false)}
        onSelect={(deviceId) => voice.setCameraDeviceId(deviceId)}
      />
    </ScrollView>
  );
});
