import { Platform } from "react-native";

export const fixConnectionUrl = (url: string) => {
    if (Platform.OS !== "android") return url;
    return url
        .replace("localhost", "10.0.2.2")
        .replace("127.0.0.1", "10.0.2.2");
};

export const TWEMOJI_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/twemoji/16.0.1/svg";
