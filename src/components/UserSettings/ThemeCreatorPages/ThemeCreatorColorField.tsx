import type { ColorLike } from "@mutualzz/ui-core";
import { Box, Input, Typography } from "@mutualzz/ui-native";

interface Props {
  label: string;
  value: ColorLike;
  onChange: (color: ColorLike) => void;
  showRandom?: boolean;
  allowGradient?: boolean;
}

export const ThemeCreatorColorField = ({
  label,
  value,
  onChange,
  showRandom,
  allowGradient = false,
}: Props) => {
  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Typography level="body-sm" weight={600} style={{ flex: 1 }}>
        {label}
      </Typography>
      <Box style={{ width: 168 }}>
        <Input
          type="color"
          size="sm"
          value={value}
          onChange={onChange}
          showRandom={showRandom}
          allowGradient={allowGradient}
          fullWidth
        />
      </Box>
    </Box>
  );
};
