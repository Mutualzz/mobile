import { SettingsToggleRow } from "@components/UserSettings/SettingsField";

interface Props {
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function SpaceSheetToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: Props) {
  return (
    <SettingsToggleRow
      title={title}
      description={description}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
