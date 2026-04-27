import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, UserPlus } from "lucide-react";
import { ApiRequestError } from "@/lib/api/errors";
import type { User } from "@/types";
import { UsersTable } from "./components/users-table";
import { InviteUserDialog } from "./components/invite-user-dialog";

export function UsersPage() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<User[]>(endpoints.users.list),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; username: string }) =>
      apiPost(endpoints.auth.inviteUser, body),
    onSuccess: () => {
      toast.success("Invitation sent");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setInviteOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to invite",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => apiDelete(endpoints.users.delete(userId)),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to delete",
      ),
  });

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    inviteMutation.mutate({
      email: String(fd.get("email")),
      username: String(fd.get("username")),
    });
  };

  const list = Array.isArray(users) ? users : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage admin and teacher accounts"
        action={
          <Button onClick={() => setInviteOpen(true)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Teacher
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Shield} title="No users found" />
      ) : (
        <UsersTable users={list} onDelete={setDeleteTarget} />
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={handleInvite}
        isPending={inviteMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete User"
        description={`Delete user "${deleteTarget?.username}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.id)
        }
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
