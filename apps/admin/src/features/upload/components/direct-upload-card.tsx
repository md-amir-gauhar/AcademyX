import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface DirectUploadCardProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
}

export function DirectUploadCard({
  onFileChange,
  isPending,
}: DirectUploadCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Direct Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input type="file" onChange={onFileChange} disabled={isPending} />
          {isPending && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
