import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import type { Batch } from "@/types";

interface BatchesTableProps {
  batches: Batch[];
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
}

export function BatchesTable({ batches, onEdit, onDelete }: BatchesTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Exam</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.name}</TableCell>
              <TableCell>{batch.class}</TableCell>
              <TableCell>{batch.exam}</TableCell>
              <TableCell>
                {batch.totalPrice > 0 ? `₹${batch.totalPrice}` : "Free"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    batch.status === "PUBLISHED"
                      ? "success"
                      : batch.status === "DRAFT"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {batch.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(batch.startDate)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(batch)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(batch)}
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
