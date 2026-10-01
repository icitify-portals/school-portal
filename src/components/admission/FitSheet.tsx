"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const MM_TO_PX = 96 / 25.4;

/** A4 in CSS px at 96dpi, rounded down so a full sheet can never overflow the paper. */
const A4_WIDTH_PX = Math.floor(210 * MM_TO_PX);
const A4_HEIGHT_PX = Math.floor(297 * MM_TO_PX);
/** 1px of headroom so sub-pixel rounding can never spill a blank second page. */
const MAX_PRINT_HEIGHT_PX = A4_HEIGHT_PX - 1;

const PRINT_STYLES = `
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
  .fitsheet-scroller { overflow: visible !important; padding: 0 !important; margin: 0 !important; opacity: 1 !important; }
  .fitsheet-sheet {
    width: ${A4_WIDTH_PX}px !important;
    max-width: none !important;
    margin: 0 auto !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .fitsheet-page {
    position: relative !important;
    overflow: hidden !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
`;

/**
 * Print environment for a page that hosts a FitSheet: strips the portal shell so the
 * sheet starts at the page origin. Pair with `letter-page` on the page root.
 */
export const LETTER_PAGE_PRINT_STYLES = `
@media print {
  html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
  aside, header, nav, footer, [role="navigation"] { display: none !important; }
  #root-container, #root-container > div { height: auto !important; min-height: 0 !important; background: #ffffff !important; }
  #root-container .flex-1.flex.flex-col > :not(main) { display: none !important; }
  main, main > div { height: auto !important; min-height: 0 !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
  main > div.fixed { display: none !important; }
  .letter-page { width: 100% !important; max-width: none !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
}
`;

type FitSheetProps = {
    children: ReactNode;
    /** Paper chrome: background, shadow, radius, border. */
    className?: string;
};

/**
 * Renders a full A4 sheet and scales its content down (transform only) so a tall
 * document always occupies exactly one page. The scaled height is baked into the
 * wrapper so the print engine paginates a single sheet instead of spilling to page 2.
 */
export default function FitSheet({ children, className = "" }: FitSheetProps) {
    const pageRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [measured, setMeasured] = useState(false);

    const fit = useCallback(() => {
        const content = contentRef.current;
        const page = pageRef.current;
        if (!content || !page) return;

        // offsetHeight is the untransformed layout height, so it stays readable while scaled.
        const naturalHeight = content.offsetHeight;
        if (naturalHeight <= 0) return;

        const scale = Math.min(1, MAX_PRINT_HEIGHT_PX / naturalHeight);

        content.style.transform = `scale(${scale})`;
        page.style.width = `${Math.floor(A4_WIDTH_PX * scale)}px`;
        page.style.height = `${Math.floor(naturalHeight * scale)}px`;

        setMeasured(true);
    }, []);

    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        let frame = 0;
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(fit);
        };

        // Catches late layout changes: web fonts swapping, images decoding, content edits.
        const observer = new ResizeObserver(schedule);
        observer.observe(content);
        content.querySelectorAll("img").forEach((img) => observer.observe(img));

        const onAssetSettle = (event: Event) => {
            if ((event.target as HTMLElement | null)?.tagName === "IMG") schedule();
        };
        content.addEventListener("load", onAssetSettle, true);
        content.addEventListener("error", onAssetSettle, true);

        // Templates use viewport-width breakpoints, so a viewport change can change natural height.
        window.addEventListener("resize", schedule);
        window.addEventListener("beforeprint", fit);
        window.addEventListener("afterprint", schedule);

        document.fonts?.ready.then(schedule, () => {});
        document.fonts?.addEventListener("loadingdone", schedule);

        schedule();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            content.removeEventListener("load", onAssetSettle, true);
            content.removeEventListener("error", onAssetSettle, true);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("beforeprint", fit);
            window.removeEventListener("afterprint", schedule);
            document.fonts?.removeEventListener("loadingdone", schedule);
        };
    }, [fit, children]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
            <div
                className={`fitsheet-scroller mx-auto w-full overflow-x-auto print:overflow-visible transition-opacity duration-150 ${
                    measured ? "opacity-100" : "opacity-0"
                }`}
            >
                <div
                    className={`fitsheet-sheet mx-auto overflow-hidden ${className}`}
                    style={{ width: A4_WIDTH_PX }}
                >
                    <div ref={pageRef} className="fitsheet-page relative overflow-hidden mx-auto">
                        {/* Absolute so the scaled layer contributes no layout height: print
                            pagination follows layout, and transform alone never shrinks it. */}
                        <div
                            ref={contentRef}
                            style={{ position: "absolute", top: 0, left: 0, width: A4_WIDTH_PX, transformOrigin: "top left" }}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
