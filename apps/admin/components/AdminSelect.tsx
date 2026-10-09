"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui/components/select";

const EMPTY_VALUE = "__admin_all__";
export function AdminSelect({
  value,
  onValueChange,
  options,
  label,
  id,
  disabled,
  placeholder = "Choose an option",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Select
      value={value || EMPTY_VALUE}
      onValueChange={(v) => onValueChange(v === EMPTY_VALUE ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className="admin-select-trigger"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className="admin-select-content"
        position="popper"
        sideOffset={6}
      >
        {options.map((option) => (
          <SelectItem
            className="admin-select-option"
            key={option.value || EMPTY_VALUE}
            value={option.value || EMPTY_VALUE}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
