"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { FieldConfig } from "@/components/data/ResourcePanel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditRecordModal } from "@/components/ui/EditRecordModal";
import { apiClient } from "@/lib/api/http-client";
import { useToastStore } from "@/lib/state/toast-store";

type Props = {
  row: Record<string, unknown>;
  listEndpoint: string;
  title: string;
  fields: FieldConfig[];
  rowFieldMap?: Record<string, string>;
};

function parseFieldValue(field: FieldConfig, raw: string): unknown {
  if ((field.type === "select" || field.type === "search-select") && field.integer) {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`${field.label} must be a valid value`);
    }
    return Math.trunc(value);
  }

  if (field.type === "number") {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`${field.label} must be a valid number`);
    }
    return field.integer ? Math.trunc(value) : value;
  }

  return raw;
}

function resolveRowValue(
  row: Record<string, unknown>,
  fieldName: string,
  rowFieldMap?: Record<string, string>,
): string {
  const mappedKey = rowFieldMap?.[fieldName] ?? fieldName;
  const value = row[mappedKey];
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function buildInitialFormState(
  row: Record<string, unknown>,
  fields: FieldConfig[],
  rowFieldMap?: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => [field.name, resolveRowValue(row, field.name, rowFieldMap)]),
  );
}

export function MasterRowActions({ row, listEndpoint, title, fields, rowFieldMap }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const notify = useToastStore((state) => state.push);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editFormState, setEditFormState] = useState<Record<string, string>>({});

  const rowId = Number(row.id);
  const hasValidId = Number.isInteger(rowId) && rowId > 0;
  const basePath = `${listEndpoint}/${rowId}`;

  const editMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiClient(basePath, {
        method: "PUT",
        body: payload,
      }),
    onSuccess: () => {
      setEditModalOpen(false);
      notify({ type: "success", message: `${title} updated` });
      void queryClient.invalidateQueries({ queryKey: ["list", listEndpoint] });
    },
    onError: (error) => {
      notify({ type: "error", message: error instanceof Error ? error.message : "Update failed" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () =>
      apiClient(basePath, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setDeleteModalOpen(false);
      notify({ type: "success", message: `${title} deleted` });
      void queryClient.invalidateQueries({ queryKey: ["list", listEndpoint] });
    },
    onError: (error) => {
      notify({ type: "error", message: error instanceof Error ? error.message : "Delete failed" });
    },
  });

  function openEditModal(): void {
    if (!hasValidId) {
      notify({ type: "error", message: "Invalid record id" });
      return;
    }

    setEditFormState(buildInitialFormState(row, fields, rowFieldMap));
    setEditModalOpen(true);
  }

  async function handleEditSubmit(): Promise<void> {
    if (!hasValidId) {
      notify({ type: "error", message: "Invalid record id" });
      return;
    }

    const payload: Record<string, unknown> = {};

    for (const field of fields) {
      const rawInput = editFormState[field.name] ?? "";
      const value = rawInput.trim();
      if (value.length === 0) {
        if (field.required) {
          notify({ type: "error", message: `${field.label} is required` });
          return;
        }
        continue;
      }

      try {
        payload[field.name] = parseFieldValue(field, value);
      } catch (error) {
        notify({
          type: "error",
          message: error instanceof Error ? error.message : `Invalid value for ${field.label}`,
        });
        return;
      }
    }

    await editMutation.mutateAsync(payload);
  }

  function openDeleteConfirmation(): void {
    if (!hasValidId) {
      notify({ type: "error", message: "Invalid record id" });
      return;
    }

    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm(): Promise<void> {
    await deleteMutation.mutateAsync();
  }

  return (
    <>
      <div className="inline">
        <button
          type="button"
          className="ghost"
          onClick={openEditModal}
          disabled={!hasValidId || editMutation.isPending || deleteMutation.isPending}
        >
          {editMutation.isPending ? "Saving..." : "Edit"}
        </button>
        <button
          type="button"
          className="danger"
          onClick={openDeleteConfirmation}
          disabled={!hasValidId || editMutation.isPending || deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </button>
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${title} record`}
        message="This action cannot be undone. Are you sure you want to continue?"
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        isSubmitting={deleteMutation.isPending}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
      <EditRecordModal
        isOpen={isEditModalOpen}
        title={`Edit ${title}`}
        fields={fields}
        values={editFormState}
        isSubmitting={editMutation.isPending}
        onChange={(fieldName, nextValue) =>
          setEditFormState((previous) => ({
            ...previous,
            [fieldName]: nextValue,
          }))
        }
        onCancel={() => setEditModalOpen(false)}
        onSubmit={() => {
          void handleEditSubmit();
        }}
      />
    </>
  );
}
