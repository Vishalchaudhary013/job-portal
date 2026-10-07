import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

// Windowed page numbers so long result sets don't spill a hundred buttons.
const pageWindow = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
};

const OpportunityPagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const buttonClass = "flex h-9 min-w-9 items-center justify-center rounded-sm border px-2 text-[13px] font-semibold transition-colors";

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${buttonClass} border-black/10 text-primary disabled:opacity-40`}
      >
        <LuChevronLeft className="h-4 w-4" />
      </button>

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-[13px] text-slate-400">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`${buttonClass} ${
              entry === page
                ? "border-secondary bg-secondary text-white"
                : "border-black/10 text-primary hover:border-secondary/50"
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={`${buttonClass} border-black/10 text-primary disabled:opacity-40`}
      >
        <LuChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default OpportunityPagination;
