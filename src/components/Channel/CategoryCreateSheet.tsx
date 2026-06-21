import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { ChannelType, type HttpException } from "@mutualzz/types";
import {
    Box,
    Button,
    ButtonGroup,
    InputDefault,
    Typography,
} from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { FolderSimpleIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    space: Space;
}

export const CategoryCreateSheet = observer(
    ({ visible, onClose, space }: Props) => {
        const app = useAppStore();
        const [name, setName] = useState("");
        const [error, setError] = useState<string | null>(null);

        const { mutate: createCategory, isPending } = useMutation({
            mutationKey: ["create-category", space.id, name],
            mutationFn: async () => {
                const formData = new FormData();
                formData.append("name", name.trim());
                formData.append("type", ChannelType.Category.toString());
                formData.append("spaceId", space.id);
                return app.rest.postFormData("channels", formData);
            },
            onSuccess: () => {
                setName("");
                setError(null);
                onClose();
            },
            onError: (err: HttpException) => {
                setError(err.errors?.[0]?.message ?? err.message);
            },
        });

        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={onClose}
            >
                <Box
                    style={{
                        flex: 1,
                        justifyContent: "flex-end",
                        backgroundColor: "rgba(0,0,0,0.45)",
                    }}
                >
                    <Paper
                        variant="elevation"
                        elevation={3}
                        style={{
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            padding: 20,
                            gap: 16,
                        }}
                    >
                        <Typography level="body-lg" weight="bold">
                            Create Category
                        </Typography>
                        <InputDefault
                            fullWidth
                            placeholder="Category name"
                            value={name}
                            onChangeText={setName}
                            startDecorator={
                                <FolderSimpleIcon size={18} weight="fill" />
                            }
                        />
                        {error && (
                            <Typography color="danger" level="body-sm">
                                {error}
                            </Typography>
                        )}
                        <ButtonGroup spacing={8}>
                            <Button variant="plain" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                disabled={isPending || !name.trim()}
                                onPress={() => createCategory()}
                            >
                                Create
                            </Button>
                        </ButtonGroup>
                    </Paper>
                </Box>
            </Modal>
        );
    },
);
