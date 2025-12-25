import { Platform, TextStyle } from "react-native";

export const makeTextMetrics = ({
    fontSize,
    lineHeight,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    fontFamily,
    letterSpacing,
}: {
    fontSize: number;
    lineHeight: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    fontFamily?: string;
    letterSpacing?: number;
}): TextStyle => {
    return {
        fontSize,
        lineHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,

        fontFamily,
        letterSpacing,

        textAlign: "left" as const,

        ...(Platform.OS === "android"
            ? {
                  includeFontPadding: false,
                  textAlignVertical: "top",
              }
            : null),
    };
};
