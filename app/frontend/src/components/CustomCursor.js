import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"]';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const pressedRef = useRef(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    const prefersFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (!prefersFinePointer) {
      return undefined;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;

    if (!dot || !ring) {
      return undefined;
    }

    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.22;
      current.y += (target.y - current.y) * 0.22;

      const ringScale = pressedRef.current ? 0.82 : hoverRef.current ? 1.25 : 1;
      const ringSkew = hoverRef.current ? 0.08 : 0;

      dot.style.transform = `translate3d(${target.x - 4}px, ${target.y - 4}px, 0) scale(${pressedRef.current ? 0.75 : 1})`;
      ring.style.transform = `translate3d(${current.x - 18}px, ${current.y - 18}px, 0) scale(${ringScale}, ${hoverRef.current ? 0.9 : 1}) skew(${ringSkew}rad)`;

      rafRef.current = requestAnimationFrame(tick);
    };

    const onPointerMove = (event) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerDown = () => {
      pressedRef.current = true;
    };

    const onPointerUp = () => {
      pressedRef.current = false;
    };

    const onPointerOver = (event) => {
      hoverRef.current = Boolean(event.target.closest(INTERACTIVE_SELECTOR));
    };

    const onPointerLeave = () => {
      hoverRef.current = false;
      pressedRef.current = false;
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerleave', onPointerLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerleave', onPointerLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden h-9 w-9 rounded-full border border-sky-300/70 bg-sky-300/10 shadow-[0_0_18px_rgba(56,189,248,0.22)] backdrop-blur-sm transition-opacity duration-200 md:block"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.95)] md:block"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />
    </>
  );
}
