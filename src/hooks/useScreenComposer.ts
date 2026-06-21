import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard } from "react-native";

export function useScreenComposer() {
    const [visible, setVisible] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setVisible(true);

            return () => {
                Keyboard.dismiss();
                setVisible(false);
            };
        }, []),
    );

    return visible;
}
