import { Button } from "@components/Button";
import { CameraIcon } from "phosphor-react-native";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { APISpace, HttpException } from "@mutualzz/types";
import {
  Box,
  ButtonGroup,
  InputDefault,
  Paper,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Pressable } from "react-native";
import ImagePicker, { CropRect } from "react-native-image-crop-picker";

interface CreateSpace {
  icon?: File | null;
  crop?: unknown;
}

interface Props {
  setCreating: (creating: boolean) => void;
}

export const SpaceCreate = observer(({ setCreating }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();

  const { closeAllModals } = useModal();

  const [name, setName] = useState("");

  const [imageFile, setImageFile] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Partial<CropRect> | null>(null);

  const [error, setError] = useState<string | null>(null);

  const { mutate: createSpace, isPending: creating } = useMutation({
    mutationFn: ({ icon, crop }: CreateSpace) => {
      const formData = new FormData();
      formData.append("name", name);
      if (icon) formData.append("icon", icon);
      if (crop) formData.append("crop", JSON.stringify(croppedAreaPixels));

      return app.rest.postFormData<APISpace>("spaces", formData);
    },
    onSuccess: () => {
      setImageFile(null);
      setError(null);
      setOriginalFile(null);
      closeAllModals();
    },
    onError: (err: HttpException) => {
      setError(err.errors?.[0].message ?? err.message ?? "An error occurred");
    },
  });

  const onUpload = async (file: File | File[]) => {
    let fileToUse: File;
    if (Array.isArray(file)) fileToUse = file[0];
    else fileToUse = file;

    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(reader.result as string);
      setOriginalFile(fileToUse);
    };
    reader.readAsDataURL(fileToUse);

    setError(null);
  };

  const handlePicker = () => {
    ImagePicker.openPicker({
      mediaType: "photo",
      cropping: true,
      cropperCircleOverlay: true,
    })
      .then(async (image) => {
        setCroppedAreaPixels(image.cropRect || null);
        const reader = new FileReader();

        const res = await fetch(image.path);

        reader.onload = async () => {
          setImageFile(reader.result as string);
          setOriginalFile(new File([reader.result!], "space-icon"));
        };
        reader.readAsDataURL(await res.blob());
      })
      .catch((err) => {
        console.log("Image picker error: ", err);
      })
      .finally(() => {
        ImagePicker.clean();
      });
  };

  const onClear = () => {
    setImageFile(null);
    setOriginalFile(null);
    setError(null);
    setCroppedAreaPixels(null);
  };

  const handleName = (name: string) => {
    setError(null);
    setName(name);
  };

  const handleCreate = async () => {
    if (name.trim() === "") {
      setError("Name is required");
      return;
    }

    const shouldCrop = !!croppedAreaPixels;

    createSpace({
      icon: originalFile,
      crop: shouldCrop ? croppedAreaPixels : undefined,
    });
  };

  return (
    <Paper
      elevation={2}
      transparency={10}
      style={{
        borderRadius: 12,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        height: 300,
      }}
    >
      <Typography level="h5" weight="bold">
        Create a space
      </Typography>
      <Box
        style={{
          width: "100%",
          flex: 1,
          position: "relative",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        <Pressable onPress={() => handlePicker()}>
          {imageFile ? (
            <Image
              source={{
                uri: imageFile,
              }}
              width={72}
              height={72}
              style={{
                borderRadius: 9999,
              }}
            />
          ) : (
            <Box
              style={{
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                borderRadius: 9999,
                width: 72,
                height: 72,
                borderStyle: "dashed",
                borderWidth: 1,
                borderColor: theme.colors.neutral,
                cursor: "pointer",
                gap: 4,
              }}
            >
              <CameraIcon
                color={theme.typography.colors.primary}
                size={16}
                weight="fill"
              />
              <Typography weight="bold" level="body-xs">
                Upload
              </Typography>
            </Box>
          )}
        </Pressable>
      </Box>
      <Box
        style={{
          gap: 4,
          flexDirection: "column",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Typography weight={500} level="body-sm">
          Name{" "}
          <Typography variant="plain" color="danger">
            *
          </Typography>
        </Typography>
        <InputDefault
          fullWidth
          value={name}
          onChangeText={handleName}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
        />
        {error && (
          <Typography variant="plain" color="danger" level="body-sm">
            {error}
          </Typography>
        )}
      </Box>

      <Box
        style={{
          marginTop: 12,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ButtonGroup orientation="horizontal" fullWidth spacing={10}>
          <Button
            disabled={creating || name.trim() === "" || !!error}
            onPress={() => handleCreate()}
            variant="solid"
            color="success"
          >
            Create Space
          </Button>
          {imageFile && (
            <Button disabled={creating} onPress={onClear}>
              Reset
            </Button>
          )}
        </ButtonGroup>
      </Box>
      <Box
        style={{
          gap: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <Typography>Already have an invite?</Typography>
        <Pressable onPress={() => setCreating(false)}>
          <Typography variant="plain" color="primary" disabled={creating}>
            Back to join
          </Typography>
        </Pressable>
      </Box>
    </Paper>
  );
});
