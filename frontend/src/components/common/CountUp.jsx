import { useEffect, useMemo, useRef, useState } from "react";

// Counts a display value up from zero when `active` turns true.
//
// The value goes in as the string it is meant to end on ("208K+", "5M+",
// "1.5x"), not as a number plus formatting options, so whatever a caller
// already renders is what it ends on — the suffix is carried through the
// animation rather than re-derived, and the final frame is the original string
// itself rather than something reassembled from parts.

// prefix / number / suffix, e.g. "₹1,250.5 Cr+" -> "₹", "1,250.5", " Cr+".
const VALUE_PATTERN = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s;

const parseCountValue = (value) => {
  const match = VALUE_PATTERN.exec(String(value ?? ""));
  // No digits to animate (an em dash, "N/A"): the value is rendered as-is.
  if (!match) return null;

  const [, prefix, digits, suffix] = match;
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  return {
    prefix,
    suffix,
    decimals,
    target: Number(digits.replace(/,/g, "")),
    // Only group while counting if the final value is grouped, so the number
    // doesn't gain a comma mid-animation that the last frame then drops.
    grouped: digits.includes(","),
  };
};

// Decelerating ease: most of the distance is covered early, so the number
// reads as settling onto its value rather than stopping dead.
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const CountUp = ({ value, active = true, duration = 1800 }) => {
  const parsed = useMemo(() => parseCountValue(value), [value]);
  const [current, setCurrent] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active || !parsed) return undefined;
    const { target } = parsed;

    // Someone who has asked for reduced motion still needs the number; it is
    // the movement that is decorative, so land on the value without counting.
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion || !Number.isFinite(target)) {
      setCurrent(target);
      return undefined;
    }

    let startedAt = null;
    const step = (now) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min((now - startedAt) / duration, 1);
      setCurrent(target * easeOutCubic(progress));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, parsed, duration]);

  if (!parsed) return value;

  // easeOutCubic(1) is exactly 1, so the last frame compares equal and renders
  // the caller's own string — the displayed result can't drift from the input.
  const settled = current >= parsed.target;
  // Truncated rather than rounded: rounding reaches the final digit while the
  // animation still has time left — a small target like 5 would show "5" at
  // around 57% and then sit there — so the number would stop before the motion
  // does. Truncating holds the last step until the easing actually arrives.
  const factor = 10 ** parsed.decimals;
  const counted = Math.floor(current * factor) / factor;
  const counting = parsed.grouped
    ? counted.toLocaleString(undefined, {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })
    : counted.toFixed(parsed.decimals);

  return (
    // The digit count grows as it counts ("0K+" to "208K+"), which would shove
    // the surrounding layout around on every frame. An invisible copy of the
    // final value holds the cell at its end width and the live number is laid
    // over it, so nothing moves while the number changes.
    <span className="inline-grid">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {value}
      </span>
      <span className="col-start-1 row-start-1">
        {settled ? value : `${parsed.prefix}${counting}${parsed.suffix}`}
      </span>
    </span>
  );
};

export default CountUp;
