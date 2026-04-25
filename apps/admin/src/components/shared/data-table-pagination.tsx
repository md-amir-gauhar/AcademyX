import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "@/types/api";

interface DataTablePaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  pagination,
  onPageChange,
}: DataTablePaginationProps) {
  const { page, totalPages, hasPrevPage, hasNextPage, totalCount, total } =
    pagination;
  const count = totalCount ?? total ?? 0;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        {count > 0 ? `${count} total results` : "No results"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
