export interface FilterArgs<T> {
  query: string;
  exam: string | null;
  priceFilter: "all" | "free" | "paid";
  getExam: (item: T) => string | null;
  getTitle: (item: T) => string;
  getPrice: (item: T) => number;
}

export function applyFilters<T>(items: T[], args: FilterArgs<T>): T[] {
  const q = args.query.trim().toLowerCase();
  return items.filter((item) => {
    if (q) {
      const hay = args.getTitle(item).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (args.exam) {
      if (args.getExam(item) !== args.exam) return false;
    }
    if (args.priceFilter === "free" && args.getPrice(item) > 0) return false;
    if (args.priceFilter === "paid" && args.getPrice(item) === 0) return false;
    return true;
  });
}
