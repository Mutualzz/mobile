import { Paper } from "@components/Paper";
import {
    UserSettingsSidebarCategories,
    UserSettingsSidebarPage,
} from "@contexts/UserSettingsSidebar.context";
import { FontAwesome } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppStore } from "@hooks/useStores";
import { Button, ButtonGroup, Divider, Typography } from "@mutualzz/ui-native";
import startCase from "lodash-es/startCase";
import { observer } from "mobx-react-lite";
import { Fragment, JSX } from "react";

type SettingsPages = Record<UserSettingsSidebarCategories, Pages[]>;

interface Pages {
    label: UserSettingsSidebarPage;
    icon: JSX.Element;
}

const settingsPages: SettingsPages = {
    "user-settings": [
        {
            label: "my-account",
            icon: <FontAwesome name="cog" />,
        },
        {
            label: "profile",
            icon: <FontAwesome name="paint-brush" />,
        },
    ],
    "app-settings": [
        {
            label: "appearance",
            icon: <FontAwesome name="paint-brush" />,
        },
    ],
};

const SettingsIndex = () => {
    const app = useAppStore();

    if (!app.account) return;

    const categories = Object.entries(settingsPages);

    return (
        <Paper
            style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "stretch",
                paddingVertical: 16,
                gap: 16,
            }}
            elevation={app.settings?.preferEmbossed ? 2 : 0}
        >
            {categories.map(([category, pages], index) => (
                <Fragment
                    key={`settings-sidebar-category-fragment-${category}`}
                >
                    <Paper
                        style={{
                            marginHorizontal: 12,
                            padding: 12,
                            boxShadow: "none",
                            borderRadius: 12,
                            flexDirection: "column",
                        }}
                        elevation={app.settings?.preferEmbossed ? 3 : 0}
                    >
                        <Typography level="body-sm" textColor="muted">
                            {startCase(category)}
                        </Typography>
                        <ButtonGroup
                            color="neutral"
                            orientation="vertical"
                            variant="plain"
                            spacing={1.25}
                            horizontalAlign="left"
                            fullWidth
                        >
                            {pages.map((page) => (
                                <Button
                                    startDecorator={page.icon}
                                    key={`user-settings-sidebar-${page.label}`}
                                    padding={5}
                                >
                                    {startCase(page.label)}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </Paper>
                    {index < categories.length - 1 && (
                        <Divider
                            style={{
                                paddingInline: 16,
                                filter: "opacity(0.5)",
                            }}
                            lineColor="muted"
                        />
                    )}
                </Fragment>
            ))}

            <Paper
                elevation={app.settings?.preferEmbossed ? 3 : 0}
                style={{
                    marginHorizontal: 12,
                    boxShadow: "none",
                    borderRadius: 12,
                    flexDirection: "column",
                }}
            >
                <Button
                    variant="plain"
                    color="danger"
                    fullWidth
                    padding={12}
                    horizontalAlign="left"
                    style={{ borderRadius: 12 }}
                    startDecorator={<MaterialIcons name="logout" />}
                    onPress={() => app.logout()}
                >
                    Log Out
                </Button>
            </Paper>
        </Paper>
    );
};

export default observer(SettingsIndex);
