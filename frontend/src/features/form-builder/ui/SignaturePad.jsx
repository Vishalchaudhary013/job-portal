import React, { useEffect, useRef, useState } from "react";

/**
 * Signature capture: draw with a mouse / finger / stylus on a canvas, or upload an image
 * of a signature. Emits the signature as a PNG data URL string via `onChange`.
 *
 * Used by FormComponents for `signature` fields (and any text field labelled "Signature").
 * When `disabled` (the Form Builder canvas), it renders a static placeholder.
 */
const CANVAS_HEIGHT = 160;

const SignaturePad = ({ value, onChange = () => {}, disabled = false, required = false }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPoint = useRef(null);
  const fileInputRef = useRef(null);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const [mode, setMode] = useState(value ? "uploaded" : "draw"); // draw | uploaded

  // Size the canvas to its container (accounting for devicePixelRatio) and paint any
  // existing value back onto it.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ratio = window.devicePixelRatio || 1;
    const width = wrapper.clientWidth;
    canvas.width = width * ratio;
    canvas.height = CANVAS_HEIGHT * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1F2853";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, CANVAS_HEIGHT);
        // Contain the image within the canvas.
        const scale = Math.min(width / img.width, CANVAS_HEIGHT / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (width - w) / 2, (CANVAS_HEIGHT - h) / 2, w, h);
      };
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCtx = () => canvasRef.current?.getContext("2d");

  const pointFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const source = e.touches?.[0] || e;
    return { x: source.clientX - rect.left, y: source.clientY - rect.top };
  };

  const startDraw = (e) => {
    if (disabled) return;
    e.preventDefault();
    drawingRef.current = true;
    lastPoint.current = pointFromEvent(e);
  };

  const draw = (e) => {
    if (!drawingRef.current || disabled) return;
    e.preventDefault();
    const ctx = getCtx();
    const point = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
    if (!hasInk) setHasInk(true);
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (hasInk && canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setMode("draw");
    onChange("");
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl !== "string") return;
      const canvas = canvasRef.current;
      const ctx = getCtx();
      const img = new Image();
      img.onload = () => {
        const width = canvas.clientWidth;
        ctx.clearRect(0, 0, width, CANVAS_HEIGHT);
        const scale = Math.min(width / img.width, CANVAS_HEIGHT / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (width - w) / 2, (CANVAS_HEIGHT - h) / 2, w, h);
        setHasInk(true);
        setMode("uploaded");
        onChange(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (disabled) {
    return (
      <div className="mt-1 flex h-[120px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
        Signature (draw or upload)
      </div>
    );
  }

  return (
    <div className="mt-1">
      <div ref={wrapperRef} className="relative rounded-md border border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none rounded-md"
          style={{ height: CANVAS_HEIGHT }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            {mode === "uploaded" ? "" : "Sign here — draw with your mouse or finger"}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Upload signature
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-red-600 disabled:opacity-40"
        >
          Clear
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Keeps native form validation working when the field is required. */}
      {required && (
        <input
          type="text"
          value={hasInk ? "signed" : ""}
          onChange={() => {}}
          required
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only absolute h-0 w-0 opacity-0"
        />
      )}
    </div>
  );
};

export default SignaturePad;
