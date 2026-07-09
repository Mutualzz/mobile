import { Twemoji } from "@components/emojis/Twemoji";

interface Props {
  value: string;
  size?: number;
}

export const UnicodeEmoji = ({ value, size = 18 }: Props) => (
  <Twemoji value={value} size={size} />
);
