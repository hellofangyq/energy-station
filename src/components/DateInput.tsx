"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
};

export default function DateInput({
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  name,
  defaultValue,
  className
}: Props) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="\d{4}-\d{2}-\d{2}"
      placeholder={placeholder}
      value={value}
      name={name}
      defaultValue={defaultValue}
      onChange={(event) => onChange(event.target.value)}
      className={className ?? "rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs w-full"}
    />
  );
}
