import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { Box, Button, Typography } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

export const ThemeCreatorComingSoon = observer(() => {
    const { closeModal } = useModal();

    return (
        <Paper
            style={{
                padding: 24,
                borderRadius: 12,
                gap: 12,
                maxWidth: 320,
            }}
        >
            <Typography level="body-md" weight={700}>
                Theme Creator
            </Typography>
            <Typography level="body-sm" textColor="muted">
                Custom theme editing is coming soon on mobile. You can still
                pick from built-in themes and sync with your system appearance.
            </Typography>
            <Box style={{ alignItems: "flex-end" }}>
                <Button size="sm" onPress={() => closeModal("theme-creator")}>
                    OK
                </Button>
            </Box>
        </Paper>
    );
});
