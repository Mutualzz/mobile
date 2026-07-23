import { SettingsOptionPicker } from "@components/UserSettings/SettingsField";
import { useSheet } from "@hooks/useSheet";
import { BOTTOM_SHEET_PROPS } from "@utils/sheet";

export function useSettingsOptionSheet() {
  const { openSheet, closeSheet } = useSheet();

  return (
    sheetId: string,
    title: string,
    options: { value: string; label: string }[],
    selected: string,
    onSelect: (value: string) => void,
    sheetProps: typeof BOTTOM_SHEET_PROPS = BOTTOM_SHEET_PROPS,
    scrollable = false,
  ) => {
    openSheet(
      sheetId,
      <SettingsOptionPicker
        title={title}
        options={options}
        selected={selected}
        scrollable={scrollable}
        onSelect={(value) => {
          onSelect(value);
          closeSheet(sheetId);
        }}
      />,
      sheetProps,
    );
  };
}
