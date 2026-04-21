"use client";

import * as React from "react";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

type Variant = "inline" | "clamp" | "prose";

interface HtmlContentProps {
  html?: string | null;
  className?: string;
  /**
   * - `inline`: strips block spacing so it fits on a single line.
   * - `clamp`: for card descriptions; paragraphs keep small gaps but nothing is
   *   pushed out of the visible viewport; pair with `line-clamp-*`.
   * - `prose`: full rich-text rendering with headings / lists / emphasis for
   *   hero + detail descriptions.
   */
  variant?: Variant;
  as?: keyof React.JSX.IntrinsicElements;
}

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u",
  "ul", "ol", "li", "a", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "code", "pre", "mark", "small", "sup", "sub",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style", "title"];

function sanitize(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target", "rel"],
  });
}

export function HtmlContent({
  html,
  className,
  variant = "prose",
  as: Tag = "div",
}: HtmlContentProps) {
  // Sanitize only once per `html` input.
  const safe = React.useMemo(() => (html ? sanitize(html) : ""), [html]);
  if (!safe) return null;

  const variantClass =
    variant === "inline"
      ? "rich-inline"
      : variant === "clamp"
        ? "rich-clamp"
        : "rich-prose";

  const Component = Tag as unknown as React.ElementType;
  return (
    <Component
      className={cn(variantClass, className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
