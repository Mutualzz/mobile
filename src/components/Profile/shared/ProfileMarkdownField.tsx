import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { Typography } from "@mutualzz/ui-native";
import { useState } from "react";
import type { Selection } from "@utils/markdown/types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
}

export const ProfileMarkdownField = ({
  value,
  onChange,
  placeholder,
  maxLength,
  minHeight = 96,
}: Props) => {
  const [selection, setSelection] = useState<Selection>({
    start: value.length,
    end: value.length,
  });

  const handleChange = (next: string) => {
    if (maxLength != null && next.length > maxLength) return;
    onChange(next);
  };

  return (
    <>
      <MarkdownInput
        value={value}
        onChange={handleChange}
        selection={selection}
        onChangeSelection={setSelection}
        enableMentions={false}
        enableEmoticons
        enableEmojiAutocomplete
        placeholder={placeholder}
        elevation={0}
        style={{ minHeight }}
      />
      {maxLength != null && (
        <Typography
          level="body-xs"
          textColor="muted"
          style={{ textAlign: "right" }}
        >
          {value.length}/{maxLength}
        </Typography>
      )}
    </>
  );
};
