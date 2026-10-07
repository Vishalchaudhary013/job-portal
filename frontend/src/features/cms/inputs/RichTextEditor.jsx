import React, { useEffect, useRef } from "react";
import { Bold, Eraser, Heading2, Heading3, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";

// Minimal, dependency-free rich text editor. Output is plain semantic HTML
// (p, strong, em, u, h2/h3, ul/ol/li, a); the server sanitises it again on
// save, so this is about a pleasant editing experience, not security.

const TOOLS = [
  { icon: Bold, label: "Bold", run: () => document.execCommand("bold") },
  { icon: Italic, label: "Italic", run: () => document.execCommand("italic") },
  { icon: Underline, label: "Underline", run: () => document.execCommand("underline") },
  { icon: Heading2, label: "Heading", run: () => document.execCommand("formatBlock", false, "h2") },
  { icon: Heading3, label: "Subheading", run: () => document.execCommand("formatBlock", false, "h3") },
  { icon: List, label: "Bulleted list", run: () => document.execCommand("insertUnorderedList") },
  { icon: ListOrdered, label: "Numbered list", run: () => document.execCommand("insertOrderedList") },
  {
    icon: Link2,
    label: "Link",
    run: () => {
      const url = window.prompt("Link URL (https://…)");
      if (url && /^(https?:|mailto:|tel:)/i.test(url)) document.execCommand("createLink", false, url);
    },
  },
  {
    icon: Eraser,
    label: "Clear formatting",
    run: () => {
      document.execCommand("removeFormat");
      document.execCommand("formatBlock", false, "p");
    },
  },
];

const RichTextEditor = ({ id, value, onChange, placeholder, disabled, invalid }) => {
  const ref = useRef(null);

  // Only push external value into the DOM when it actually differs, so the
  // caret doesn't jump while typing.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) ref.current.innerHTML = value || "";
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML || "";
    onChange(html === "<br>" || html === "<p><br></p>" ? "" : html);
  };

  return (
    <div className={`overflow-hidden rounded-sm border bg-white ${invalid ? "border-red-400" : "border-slate-300 focus-within:border-[#1F2853]"}`}>
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1" role="toolbar" aria-label="Formatting">
        {TOOLS.map(({ icon: Icon, label, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              ref.current?.focus();
              run();
              emit();
            }}
            className="rounded-sm p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder || "Start writing…"}
        onInput={emit}
        onBlur={emit}
        onPaste={(event) => {
          // Paste as plain text — pasted Word/Docs markup is never what anyone wants.
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
        }}
        className="min-h-[140px] px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-[#1F2853] [&_a]:underline"
      />
    </div>
  );
};

export default RichTextEditor;
