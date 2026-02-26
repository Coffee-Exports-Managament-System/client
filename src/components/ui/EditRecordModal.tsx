"use client";

import { useEffect } from "react";

import type { FieldConfig } from "@/components/data/ResourcePanel";
import { SearchableSelectControl } from "@/components/data/SearchableSelectControl";

type Props = {
  isOpen: boolean;
  title: string;
  fields: FieldConfig[];
  values: Record<string, string>;
  isSubmitting?: boolean;
  onChange: (fieldName: string, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function EditRecordModal({
  isOpen,
  title,
  fields,
  values,
  isSubmitting = false,
  onChange,
  onCancel,
  onSubmit,
}: Props): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="confirm-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      <form
        className="confirm-modal form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <h3 id="edit-modal-title">{title}</h3>
        <div className="stack">
          <div className="inline">
            {fields.map((field) => {
              const value = values[field.name] ?? "";

              if (field.type === "select") {
                return (
                  <label key={field.name}>
                    {field.label}
                    <select
                      value={value}
                      disabled={isSubmitting}
                      onChange={(event) => onChange(field.name, event.target.value)}
                    >
                      <option value="">Select...</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              if (field.type === "search-select") {
                return (
                  <label key={field.name}>
                    {field.label}
                    <SearchableSelectControl
                      value={value}
                      disabled={isSubmitting}
                      options={field.options ?? []}
                      placeholder="Select..."
                      onChange={(nextValue) => onChange(field.name, nextValue)}
                    />
                  </label>
                );
              }

              return (
                <label key={field.name}>
                  {field.label}
                  <input
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    step={field.type === "number" && !field.integer ? "0.001" : undefined}
                    disabled={isSubmitting}
                    value={value}
                    onChange={(event) => onChange(field.name, event.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="confirm-modal-actions">
          <button type="button" className="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
