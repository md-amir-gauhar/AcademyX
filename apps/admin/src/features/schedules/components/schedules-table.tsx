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
import { formatDateTime } from "@/lib/utils";
import type { Schedule } from "@/types";

interface SchedulesTableProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

export function SchedulesTable({
  schedules,
  onEdit,
  onDelete,
}: SchedulesTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Scheduled At</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell className="font-medium">{schedule.title}</TableCell>
              <TableCell>{schedule.subjectName}</TableCell>
              <TableCell>{formatDateTime(schedule.scheduledAt)}</TableCell>
              <TableCell>{schedule.duration} min</TableCell>
              <TableCell>
                <Badge
                  variant={
                    schedule.status === "COMPLETED"
                      ? "success"
                      : schedule.status === "LIVE"
                        ? "default"
                        : "secondary"
                  }
                >
                  {schedule.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(schedule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(schedule)}
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
