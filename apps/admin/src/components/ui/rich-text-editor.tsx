import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  name: string;
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onChange?: (html: string) => void;
}

/**
 * A Tiptap-based rich text editor that mirrors its HTML output to a hidden
 * input so it works inside a regular `<form>` + `FormData` flow.
 *
 * Usage:
 * ```tsx
 * <RichTextEditor
 *   name="description"
 *   defaultValue={editing?.description}
 *   placeholder="Describe this batch..."
 * />
 * ```
 *
 * The form's `onSubmit` can read `fd.get("description")` as before — the value
 * is the HTML string from the editor, or "" when empty.
 */
export function RichTextEditor({
  name,
  id,
  defaultValue = "",
  placeholder = "Start typing...",
  className,
  onChange,
}: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue);
  const initialValueRef = useRef(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground/60 before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[140px] w-full px-3 py-2 text-sm focus:outline-none",
          "[&_p]:my-1 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        ),
      },
    },
    onUpdate({ editor }) {
      const content = editor.isEmpty ? "" : editor.getHTML();
      setHtml(content);
      onChange?.(content);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (defaultValue !== initialValueRef.current) {
      initialValueRef.current = defaultValue;
      editor.commands.setContent(defaultValue || "", { emitUpdate: false });
      setHtml(defaultValue);
    }
  }, [defaultValue, editor]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} id={id} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

interface ToolbarProps {
  editor: Editor | null;
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return <div className="h-9 border-b border-border bg-muted/30" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-1.5 py-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        label="Underline"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        label="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
        label="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bulleted list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Quote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="Code block"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => promptForLink(editor)}
        active={editor.isActive("link")}
        label="Insert / edit link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  );
}

function promptForLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Link URL", previous ?? "https://");
  if (url === null) return;
  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
}

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-border" />;
}
