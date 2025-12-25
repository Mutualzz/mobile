import styled from "@emotion/native";
import { View } from "react-native";

export const Blockquote = styled(View)(({ theme }) => ({
    marginVertical: 0,
    borderLeftWidth: 4,
    borderLeftColor: theme.typography.colors.muted,
    paddingLeft: 8,
}));
