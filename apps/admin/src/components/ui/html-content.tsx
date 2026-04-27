import { cn } from "@/lib/utils";

interface HtmlContentProps {
  html?: string | null;
  className?: string;
}

/**
 * Renders HTML content authored in the admin's rich text editor. Trusted
 * source — admins author their own content — so we render directly without a
 * sanitizer. If we ever expose this in a context where untrusted input could
 * land here, swap to DOMPurify before injecting.
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  if (!html) return null;
  return (
    <div
      className={cn(
        "text-sm leading-relaxed text-foreground/90",
        "[&_p]:my-1 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
