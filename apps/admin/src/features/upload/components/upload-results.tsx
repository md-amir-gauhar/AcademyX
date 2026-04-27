import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import type { UploadResult } from "../types";

interface UploadResultsProps {
  results: UploadResult[];
  copied: string | null;
  onCopy: (text: string) => void;
}

export function UploadResults({
  results,
  copied,
  onCopy,
}: UploadResultsProps) {
  if (results.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Recent Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.map((result, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {result.originalName || result.key}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {result.cdnUrl || result.publicUrl || result.uploadUrl}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  onCopy(
                    result.cdnUrl ||
                      result.publicUrl ||
                      result.uploadUrl ||
                      "",
                  )
                }
              >
                {copied ===
                (result.cdnUrl ||
                  result.publicUrl ||
                  result.uploadUrl) ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
