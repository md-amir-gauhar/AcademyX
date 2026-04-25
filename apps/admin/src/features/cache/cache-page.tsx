import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Database, Trash2, RefreshCcw, Zap } from "lucide-react";
import type { CacheStats } from "@/types";
import { ApiRequestError } from "@/lib/api/errors";
import { useState } from "react";

export function CachePage() {
  const queryClient = useQueryClient();
  const [flushOpen, setFlushOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cache-stats"],
    queryFn: () => apiGet<CacheStats>(endpoints.cache.stats),
  });

  const clearMutation = useMutation({
    mutationFn: () => apiPost<{ clearedKeys: number }>(endpoints.cache.clear),
    onSuccess: (res) => {
      toast.success(`Cleared cache keys`);
      queryClient.invalidateQueries({ queryKey: ["cache-stats"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to clear",
      ),
  });

  const flushMutation = useMutation({
    mutationFn: () => apiPost(endpoints.cache.flush),
    onSuccess: () => {
      toast.success("Cache flushed");
      queryClient.invalidateQueries({ queryKey: ["cache-stats"] });
      setFlushOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to flush",
      ),
  });

  const stats =
    data && typeof data === "object" && "isAvailable" in data
      ? (data as CacheStats)
      : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cache"
        description="Redis cache management"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <Badge variant={stats?.isAvailable ? "success" : "destructive"}>
                {stats?.isAvailable ? "Online" : "Offline"}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Key Count
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats?.keyCount ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memory Used
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {stats?.memoryUsed ?? "N/A"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {clearMutation.isPending ? "Clearing..." : "Clear Cache"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setFlushOpen(true)}
          disabled={flushMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Flush All
        </Button>
      </div>

      <ConfirmDialog
        open={flushOpen}
        onOpenChange={setFlushOpen}
        title="Flush Entire Cache"
        description="This will delete ALL cached data. This action cannot be undone. Are you sure?"
        confirmLabel="Flush All"
        onConfirm={() => flushMutation.mutate()}
        loading={flushMutation.isPending}
      />
    </div>
  );
}
