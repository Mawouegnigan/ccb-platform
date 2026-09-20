"use client";

import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  required,
  minLength,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink text-sm px-1"
      >
        {visible ? "🙈" : "👁"}
      </button>
    </div>
  );
}