import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export const useKeyboardOffset = () => {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (Platform.OS !== "android") return;

        const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
            setHeight(e.endCoordinates?.height ?? 0);
        });

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return height;
};
