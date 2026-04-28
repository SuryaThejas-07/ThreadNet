import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const ringRef = useRef(null);
  const frameRef = useRef(null);
  const dotRef = useRef(null);
  const targetPosRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const hoverStateRef = useRef(false);
  const hideStateRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      }

      const target = e.target;
      if (!(target instanceof Element)) {
        return;
      }
      const shouldHover = Boolean(
        target.closest('button, a, [data-cursor], [role="button"]'),
      );
      const shouldHide = Boolean(
        target.closest('input, textarea, select, label, [contenteditable="true"]'),
      );

      if (hoverStateRef.current !== shouldHover) {
        hoverStateRef.current = shouldHover;
        setIsHovering(shouldHover);
      }

      if (hideStateRef.current !== shouldHide) {
        hideStateRef.current = shouldHide;
        setHideCursor(shouldHide);
      }
    };

    // Ring animation with requestAnimationFrame for lag effect
    const animateRing = () => {
      const dx = targetPosRef.current.x - ringPosRef.current.x;
      const dy = targetPosRef.current.y - ringPosRef.current.y;
      ringPosRef.current.x += dx * 0.15;
      ringPosRef.current.y += dy * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPosRef.current.x - 13}px, ${ringPosRef.current.y - 13}px)`;
        if (isHovering) {
          ringRef.current.classList.add('hover');
        } else {
          ringRef.current.classList.remove('hover');
        }
      }

      frameRef.current = requestAnimationFrame(animateRing);
    };

    document.addEventListener('mousemove', handleMouseMove);

    frameRef.current = requestAnimationFrame(animateRing);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isHovering]);

  return (
    <>
      <div className={`cursor-dot ${hideCursor ? 'cursor-hidden' : ''}`} ref={dotRef} />
      <div className={`cursor-ring ${hideCursor ? 'cursor-hidden' : ''}`} ref={ringRef} />
    </>
  );
};

export default CustomCursor;
