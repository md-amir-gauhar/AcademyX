import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, adminClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link, Copy, Check } from "lucide-react";
import { ApiRequestError } from "@/lib/api/errors";

interface UploadResult {
  key: string;
  location?: string;
  cdnUrl?: string;
  publicUrl?: string;
  uploadUrl?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
}

export function UploadPage() {
  const [results, setResults] = useState<UploadResult[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const directUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminClient.post(endpoints.upload.direct, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as UploadResult;
    },
    onSuccess: (data) => {
      toast.success("File uploaded!");
      setResults((prev) => [data, ...prev]);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Upload failed",
      ),
  });

  const signedUrlMutation = useMutation({
    mutationFn: (body: {
      fileName: string;
      fileType: string;
      fileSize: number;
    }) => apiPost<UploadResult>(endpoints.upload.signedUrl, body),
    onSuccess: (res) => {
      toast.success("Signed URL generated");
      if (res.data) setResults((prev) => [res.data as UploadResult, ...prev]);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed",
      ),
  });

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) directUploadMutation.mutate(file);
  };

  const handleSignedUrl = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    signedUrlMutation.mutate({
      fileName: String(fd.get("fileName")),
      fileType: String(fd.get("fileType")),
      fileSize: Number(fd.get("fileSize")),
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Uploads"
        description="Upload files and generate signed URLs"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              Direct Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                onChange={handleDirectUpload}
                disabled={directUploadMutation.isPending}
              />
              {directUploadMutation.isPending && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link className="h-4 w-4" />
              Signed URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignedUrl} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  name="fileName"
                  placeholder="document.pdf"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fileType">File Type</Label>
                  <Input
                    id="fileType"
                    name="fileType"
                    placeholder="application/pdf"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileSize">File Size (bytes)</Label>
                  <Input
                    id="fileSize"
                    name="fileSize"
                    type="number"
                    placeholder="1048576"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={signedUrlMutation.isPending}
              >
                Generate Signed URL
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
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
                      copyToClipboard(
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
      )}
    </div>
  );
}
