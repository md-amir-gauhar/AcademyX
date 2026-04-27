import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Send, Pencil, Trash2, ListChecks } from "lucide-react";
import type { Test } from "@/types";

interface TestsTableProps {
  tests: Test[];
  onPublish: (testId: string) => void;
  onEdit: (test: Test) => void;
  onDelete: (test: Test) => void;
}

export function TestsTable({
  tests,
  onPublish,
  onEdit,
  onDelete,
}: TestsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Total Marks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[260px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell className="font-medium">{test.title}</TableCell>
              <TableCell>{test.duration} min</TableCell>
              <TableCell>{test.totalMarks}</TableCell>
              <TableCell>
                <Badge variant={test.isPublished ? "success" : "secondary"}>
                  {test.isPublished ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/tests/${test.id}/builder`)}
                  >
                    <ListChecks className="mr-1.5 h-3.5 w-3.5" />
                    Manage
                  </Button>
                  {!test.isPublished && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPublish(test.id)}
                      title="Publish"
                    >
                      <Send className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(test)}
                    title="Edit details"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(test)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
