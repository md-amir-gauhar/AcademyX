import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "lucide-react";

interface SignedUrlCardProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export function SignedUrlCard({ onSubmit, isPending }: SignedUrlCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link className="h-4 w-4" />
          Signed URL
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
          <Button type="submit" disabled={isPending}>
            Generate Signed URL
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
