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
import { Pencil, Trash2 } from "lucide-react";
import type { TestSeries } from "@/types";

interface TestSeriesTableProps {
  items: TestSeries[];
  onEdit: (series: TestSeries) => void;
  onDelete: (series: TestSeries) => void;
}

export function TestSeriesTable({
  items,
  onEdit,
  onDelete,
}: TestSeriesTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Exam</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((series) => (
            <TableRow key={series.id}>
              <TableCell className="font-medium">{series.title}</TableCell>
              <TableCell>{series.exam}</TableCell>
              <TableCell>
                {series.isFree ? "Free" : `₹${series.totalPrice}`}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    series.status === "PUBLISHED" ? "success" : "secondary"
                  }
                >
                  {series.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(series)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(series)}
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
