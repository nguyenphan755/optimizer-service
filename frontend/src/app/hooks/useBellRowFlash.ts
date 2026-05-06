import { useEffect, useRef, useState } from "react";

export type BellRowHighlightPayload = { submissionIds: number[]; token: number };

/**
 * Scroll tới dòng đầu tiên tìm thấy, nhấp nháy khung ~1s, gọi onConsumed khi kết thúc.
 */
export function useBellRowFlash(
  highlight: BellRowHighlightPayload | null | undefined,
  onConsumed?: () => void,
  rowIdPrefix = "mes-submission-row"
): Set<number> {
  const [flashIds, setFlashIds] = useState<Set<number>>(() => new Set());
  const onConsumedRef = useRef(onConsumed);
  onConsumedRef.current = onConsumed;

  useEffect(() => {
    if (!highlight?.submissionIds?.length) return;
    const ids = highlight.submissionIds;
    setFlashIds(new Set(ids));

    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        for (const id of ids) {
          const el = document.getElementById(`${rowIdPrefix}-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
          }
        }
      });
    });

    const clearT = window.setTimeout(() => {
      setFlashIds(new Set());
      onConsumedRef.current?.();
    }, 1000);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(clearT);
      setFlashIds(new Set());
    };
  }, [highlight, rowIdPrefix]);

  return flashIds;
}
