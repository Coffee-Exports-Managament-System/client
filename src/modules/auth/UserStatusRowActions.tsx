"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { apiClient } from "@/lib/api/http-client";
import { useToastStore } from "@/lib/state/toast-store";

type Props = {
  row: Record<string, unknown>;
  listEndpoint: string;
};

function toPositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function toActiveFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "active";
  }
  return false;
}

export function UserStatusRowActions({ row, listEndpoint }: Props): React.JSX.Element {
  const notify = useToastStore((state) => state.push);
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);

  const userId = toPositiveInteger(row.id);
  const isActive = toActiveFlag(row.is_active ?? row.status);
  const nextStatus = isActive ? "disabled" : "active";
  const actionLabel = isActive ? "Disable" : "Activate";
  const subject = String(row.full_name ?? row.email ?? `User ${String(row.id ?? "")}`).trim();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Invalid user id");
      }
      return apiClient(`auth/users/${userId}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
    },
    onSuccess: () => {
      notify({ type: "success", message: `User ${nextStatus === "active" ? "activated" : "disabled"}` });
      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["list", listEndpoint] });
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
    onError: (error) => {
      notify({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update user status",
      });
    },
  });

  return (
    <>
      <button
        type="button"
        className={isActive ? "danger" : "secondary"}
        disabled={!userId || mutation.isPending}
        onClick={() => setModalOpen(true)}
      >
        {mutation.isPending ? "Updating..." : actionLabel}
      </button>
      <ConfirmModal
        isOpen={isModalOpen}
        title={`${actionLabel} User`}
        message={`Are you sure you want to ${nextStatus} ${subject}?`}
        confirmLabel={actionLabel}
        cancelLabel="Cancel"
        isSubmitting={mutation.isPending}
        onCancel={() => setModalOpen(false)}
        onConfirm={() => {
          void mutation.mutateAsync();
        }}
      />
    </>
  );
}
