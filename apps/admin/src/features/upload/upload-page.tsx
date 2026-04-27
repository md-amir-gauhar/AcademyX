import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, adminClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/shared/page-header";
import { ApiRequestError } from "@/lib/api/errors";
import type { UploadResult } from "./types";
import { DirectUploadCard } from "./components/direct-upload-card";
import { SignedUrlCard } from "./components/signed-url-card";
import { UploadResults } from "./components/upload-results";

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
        <DirectUploadCard
          onFileChange={handleDirectUpload}
          isPending={directUploadMutation.isPending}
        />
        <SignedUrlCard
          onSubmit={handleSignedUrl}
          isPending={signedUrlMutation.isPending}
        />
      </div>

      <UploadResults
        results={results}
        copied={copied}
        onCopy={copyToClipboard}
      />
    </div>
  );
}
