import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TestSeries } from "@/types";

interface SeriesSelectorProps {
  allSeries: TestSeries[];
  value: string;
  onChange: (value: string) => void;
}

export function SeriesSelector({
  allSeries,
  value,
  onChange,
}: SeriesSelectorProps) {
  return (
    <div className="mb-6 max-w-sm space-y-2">
      <Label>Select Test Series</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a test series..." />
        </SelectTrigger>
        <SelectContent>
          {allSeries.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
