import React, { useState, useRef, useEffect } from "react";
import { FiInfo } from "react-icons/fi";

const TextEditor = ({ label, value, onChange, placeholder, tooltip }) => {
  const editorRef = useRef(null);
  const savedRange = useRef(null);

  const [showImgModal, setShowImgModal] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState("");

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState("");

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({ rows: 0, cols: 0 });

  useEffect(() => {
    if (
      editorRef.current &&
      value !== undefined &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-3">
        {label} <span className="text-rose-600">*</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help text-gray-400">
            <FiInfo size={14} />
          </span>
        )}
      </label>

      <div className="border border-gray-200 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center gap-0.5 flex-wrap select-none">
        {[
          {
            title: "Bold",
            cmd: "bold",
            label: <span className="font-bold text-sm">B</span>,
          },
          {
            title: "Italic",
            cmd: "italic",
            label: <span className="italic text-sm">I</span>,
          },
          {
            title: "Underline",
            cmd: "underline",
            label: <span className="underline text-sm">U</span>,
          },
        ].map(({ title, cmd, label }) => (
          <button
            type="button"
            key={cmd}
            title={title}
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand(cmd, false);
            }}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-700 cursor-pointer transition"
          >
            {label}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-300 mx-1.5" />
        <select
          defaultValue="14"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            document.execCommand("fontSize", false, "7");
            const els = document.querySelectorAll("[size='7']");
            els.forEach((el) => {
              el.removeAttribute("size");
              el.style.fontSize = e.target.value + "px";
            });
          }}
          className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white outline-none cursor-pointer h-6"
        >
          {["10", "12", "14", "16", "18", "20", "24", "28", "32", "Normal"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>
        <div className="w-px h-5 bg-gray-300 mx-1.5" />
        {[
          {
            title: "Align Left",
            cmd: "justifyLeft",
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line
                  x1="1"
                  y1="3"
                  x2="13"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="1"
                  y1="7"
                  x2="9"
                  y2="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="1"
                  y1="11"
                  x2="13"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ),
          },
          {
            title: "Align Center",
            cmd: "justifyCenter",
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line
                  x1="1"
                  y1="3"
                  x2="13"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="3"
                  y1="7"
                  x2="11"
                  y2="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="1"
                  y1="11"
                  x2="13"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ),
          },
          {
            title: "Align Right",
            cmd: "justifyRight",
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line
                  x1="1"
                  y1="3"
                  x2="13"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="5"
                  y1="7"
                  x2="13"
                  y2="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="1"
                  y1="11"
                  x2="13"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ),
          },
        ].map(({ title, cmd, icon }) => (
          <button
            type="button"
            key={cmd}
            title={title}
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand(cmd, false);
            }}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-600 cursor-pointer transition"
          >
            {icon}
          </button>
        ))}
        <button
          type="button"
          title="Bullet List"
          onMouseDown={(e) => {
            e.preventDefault();
            document.execCommand("insertUnorderedList", false);
          }}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-600 cursor-pointer transition"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="2" cy="3.5" r="1.2" fill="currentColor" />
            <line
              x1="5"
              y1="3.5"
              x2="13"
              y2="3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="2" cy="7" r="1.2" fill="currentColor" />
            <line
              x1="5"
              y1="7"
              x2="13"
              y2="7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="2" cy="10.5" r="1.2" fill="currentColor" />
            <line
              x1="5"
              y1="10.5"
              x2="13"
              y2="10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          title="Numbered List"
          onMouseDown={(e) => {
            e.preventDefault();
            document.execCommand("insertOrderedList", false);
          }}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-600 cursor-pointer transition"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 1.5v4m-1-1h2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <line
              x1="5.5"
              y1="3.5"
              x2="13"
              y2="3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M1.5 8.5h2a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2h2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="5.5"
              y1="10.5"
              x2="13"
              y2="10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1.5" />

        <button
          type="button"
          title="Insert Image"
          onMouseDown={(e) => {
            e.preventDefault();
            const sel = window.getSelection();
            if (sel && sel.rangeCount)
              savedRange.current = sel.getRangeAt(0).cloneRange();
            setImgUrlInput("");
            setShowImgModal(true);
          }}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-600 cursor-pointer transition"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect
              x="1"
              y="2"
              width="13"
              height="11"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <circle
              cx="4.5"
              cy="5.5"
              r="1.3"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <polyline
              points="1,11 4.5,7.5 7,10 9.5,7.5 14,11"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          title="Insert Link"
          onMouseDown={(e) => {
            e.preventDefault();
            const sel = window.getSelection();
            if (sel && sel.rangeCount)
              savedRange.current = sel.getRangeAt(0).cloneRange();
            setLinkUrlInput("");
            setShowLinkModal(true);
          }}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-600 cursor-pointer transition"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M5.5 9.5a3.5 3.5 0 0 0 4.95 0l2-2a3.5 3.5 0 0 0-4.95-4.95L6.5 3.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M9.5 5.5a3.5 3.5 0 0 0-4.95 0l-2 2a3.5 3.5 0 0 0 4.95 4.95l1-1"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="relative">
          <button
            type="button"
            title="Insert Table"
            onMouseDown={(e) => {
              e.preventDefault();
              const sel = window.getSelection();
              if (sel && sel.rangeCount)
                savedRange.current = sel.getRangeAt(0).cloneRange();
              setTableHover({ rows: 0, cols: 0 });
              setShowTablePicker((p) => !p);
            }}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 text-gray-600 cursor-pointer transition"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect
                x="1"
                y="1"
                width="13"
                height="13"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <line
                x1="1"
                y1="5.5"
                x2="14"
                y2="5.5"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <line
                x1="1"
                y1="9.5"
                x2="14"
                y2="9.5"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <line
                x1="5.5"
                y1="1"
                x2="5.5"
                y2="14"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <line
                x1="9.5"
                y1="1"
                x2="9.5"
                y2="14"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
          </button>
          {showTablePicker && (
            <div
              className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 select-none"
              onMouseLeave={() => setTableHover({ rows: 0, cols: 0 })}
            >
              <p className="text-[11px] font-semibold text-gray-500 mb-2 text-center tracking-wide">
                Table
              </p>
              <div className="flex flex-col gap-0.5">
                {Array.from({ length: 8 }, (_, r) => (
                  <div key={r} className="flex gap-0.5">
                    {Array.from({ length: 8 }, (_, c) => (
                      <div
                        key={c}
                        onMouseEnter={() =>
                          setTableHover({ rows: r + 1, cols: c + 1 })
                        }
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const rows = r + 1,
                            cols = c + 1;
                          const html =
                            `<table style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>` +
                            Array(rows)
                              .fill(0)
                              .map(
                                () =>
                                  `<tr>` +
                                  Array(cols)
                                    .fill(0)
                                    .map(
                                      () =>
                                        `<td style="border:1px solid #E2E8F0;padding:6px 10px;min-width:60px">&nbsp;</td>`,
                                    )
                                    .join("") +
                                  `</tr>`,
                              )
                              .join("") +
                            `</tbody></table><p><br></p>`;
                          const editor = editorRef.current;
                          if (editor) editor.focus();
                          const sel = window.getSelection();
                          if (savedRange.current) {
                            sel.removeAllRanges();
                            sel.addRange(savedRange.current);
                          }
                          let success = false;
                          try {
                            success = document.execCommand(
                              "insertHTML",
                              false,
                              html,
                            );
                          } catch (err) {
                            console.log(err);
                          }
                          if (!success && savedRange.current) {
                            const temp = document.createElement("div");
                            temp.innerHTML = html;
                            const frag = document.createDocumentFragment();
                            let node, lastNode;
                            while ((node = temp.firstChild)) {
                              lastNode = frag.appendChild(node);
                            }
                            savedRange.current.insertNode(frag);
                            if (lastNode) {
                              savedRange.current.setStartAfter(lastNode);
                              savedRange.current.collapse(true);
                            }
                            sel.removeAllRanges();
                            sel.addRange(savedRange.current);
                          }
                          if (editor) {
                            onChange(editor.innerHTML);
                          }
                          setShowTablePicker(false);
                        }}
                        className={`w-5 h-5 rounded-sm border cursor-pointer transition-colors ${r < tableHover.rows && c < tableHover.cols ? "bg-[#1F2853]/20 border-[#1F2853]/40" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-center text-gray-500 mt-2 font-medium">
                {tableHover.rows > 0
                  ? `${tableHover.cols} × ${tableHover.rows}`
                  : "Hover to select"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        className="w-full min-h-[220px] border border-t-0 border-gray-200 rounded-b-lg px-4 py-3 text-sm text-gray-800 outline-none transition overflow-auto rich-editor"
        style={{ lineHeight: "1.7", backgroundColor: "white" }}
      />
      <style>{`.rich-editor:empty:before{content:attr(data-placeholder);color:#1F2853;pointer-events:none}.rich-editor table{border-collapse:collapse;width:100%;margin:8px 0}.rich-editor td,.rich-editor th{border:1px solid #E2E8F0;padding:6px 10px;min-width:60px}.rich-editor a{color:#1F2853;text-decoration:underline}.rich-editor img{max-width:100%;border-radius:4px;margin:4px 0}.rich-editor ul{list-style:disc;padding-left:1.5rem;margin:4px 0}.rich-editor ol{list-style:decimal;padding-left:1.5rem;margin:4px 0}`}</style>

      {showImgModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onMouseDown={() => setShowImgModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-6 animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-5">
              Insert Image
            </h3>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Insert from URL
              </p>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imgUrlInput}
                onChange={(e) => setImgUrlInput(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1F2853] focus:ring-1 focus:ring-[#1F2853] transition"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImgModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!imgUrlInput.trim()) return;
                  const sel = window.getSelection();
                  if (savedRange.current) {
                    sel.removeAllRanges();
                    sel.addRange(savedRange.current);
                  }
                  document.execCommand(
                    "insertImage",
                    false,
                    imgUrlInput.trim(),
                  );
                  onChange(editorRef.current.innerHTML);
                  setShowImgModal(false);
                }}
                className="px-5 py-2 text-sm font-semibold bg-[#1F2853] text-white rounded-lg hover:bg-[#1a0080] transition cursor-pointer disabled:opacity-40"
                disabled={!imgUrlInput.trim()}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onMouseDown={() => setShowLinkModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] mx-4 p-6 animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-5">
              Insert Link
            </h3>
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                URL / Web Address
              </p>
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && linkUrlInput.trim()) {
                    const sel = window.getSelection();
                    if (savedRange.current) {
                      sel.removeAllRanges();
                      sel.addRange(savedRange.current);
                    }
                    document.execCommand(
                      "createLink",
                      false,
                      linkUrlInput.trim(),
                    );
                    onChange(editorRef.current.innerHTML);
                    setShowLinkModal(false);
                  }
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1F2853] focus:ring-1 focus:ring-[#1F2853] transition"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!linkUrlInput.trim()) return;
                  const sel = window.getSelection();
                  if (savedRange.current) {
                    sel.removeAllRanges();
                    sel.addRange(savedRange.current);
                  }
                  document.execCommand(
                    "createLink",
                    false,
                    linkUrlInput.trim(),
                  );
                  onChange(editorRef.current.innerHTML);
                  setShowLinkModal(false);
                }}
                className="px-5 py-2 text-sm font-semibold bg-[#1F2853] text-white rounded-lg hover:bg-[#1a0080] transition cursor-pointer disabled:opacity-40"
                disabled={!linkUrlInput.trim()}
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
