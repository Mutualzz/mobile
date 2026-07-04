import type { ColorLike } from "@mutualzz/ui-core";
import { Box, Input, Typography } from "@mutualzz/ui-native";

interface Props {
  label: string;
  description?: string;
  value: ColorLike;
  onChange: (color: ColorLike) => void;
  showRandom?: boolean;
}

export const ThemeCreatorColorField = ({
  label,
  description,
  value,
  onChange,
  showRandom,
}: Props) => {
  return (
    <Box style={{ gap: 6 }}>
      <Typography level="body-xs" weight={700}>
        {label}
      </Typography>
      {description && (
        <Typography level="body-xs" textColor="muted">
          {description}
        </Typography>
      )}
      <Input
        type="color"
        value={value}
        onChange={onChange}
        showRandom={showRandom}
        fullWidth
      />
    </Box>
  );
};
