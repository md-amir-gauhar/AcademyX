import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CacheStats } from "@/types";

interface SystemStatusProps {
  cacheData: unknown;
  isLoading: boolean;
}

export function SystemStatus({ cacheData, isLoading }: SystemStatusProps) {
  const stats =
    cacheData && typeof cacheData === "object" ? (cacheData as CacheStats) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cache Available</span>
          <span className="text-sm font-medium">
            {stats && "isAvailable" in stats
              ? stats.isAvailable
                ? "Online"
                : "Offline"
              : "Unknown"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Memory Used</span>
          <span className="text-sm font-medium">
            {stats && "memoryUsed" in stats ? stats.memoryUsed : "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
