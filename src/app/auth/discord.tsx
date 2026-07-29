import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import type { APIPrivateUser } from "@mutualzz/types";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const DiscordAuthCallback = () => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const router = useRouter();
  const params = useLocalSearchParams<{
    token?: string;
    pending?: string;
    linked?: string;
    error?: string;
  }>();
  const [message, setMessage] = useState(t("discordAuth.processing"));

  useEffect(() => {
    if (params.token) {
      app.setToken(String(params.token));
      router.replace("/");
      return;
    }

    if (params.pending) {
      router.replace(
        `/register/discord?pending=${encodeURIComponent(String(params.pending))}` as Href,
      );
      return;
    }

    if (params.linked) {
      void app.rest.get<APIPrivateUser>("/@me").then((user) => {
        app.setUser(user);
        void app.profiles.resolve(user.id, true);
        router.replace("/settings/discord-import");
      });
      return;
    }

    if (params.error) {
      setMessage(t("discordAuth.error"));
      return;
    }

    setMessage(t("discordAuth.invalidCallback"));
  }, [app, params.error, params.linked, params.pending, params.token, router, t]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Typography>{message}</Typography>
    </View>
  );
};

export default observer(DiscordAuthCallback);
