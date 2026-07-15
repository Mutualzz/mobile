import { BrandLoader } from "@components/BrandLoader";
import { splashBackgroundForScheme } from "@utils/splash";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { Modal, StyleSheet, useColorScheme, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

interface Props {
  hideNativeSplash?: boolean;
}

export const BootSplash = observer(({ hideNativeSplash = true }: Props) => {
  const scheme = useColorScheme();
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (!hideNativeSplash || hiddenRef.current) return;
    hiddenRef.current = true;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [hideNativeSplash]);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View
        style={[
          styles.root,
          { backgroundColor: splashBackgroundForScheme(scheme) },
        ]}
      >
        <BrandLoader size={108} />
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
