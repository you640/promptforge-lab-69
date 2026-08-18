import { useEffect, useRef } from "react";

const SANDBOX = "allow-scripts allow-forms allow-modals allow-popups allow-pointer-lock";

/**
 * Izolovaný iframe pre náhľad. Dokument dodávame ako blob URL, takže
 * iframe má vlastný opaque origin a nedostane sa k dátam aplikácie.
 */
export function PreviewFrame({
  document: doc,
  width,
  height,
  onFrame,
}: {
  document: string;
  width: number | "100%";
  height: number;
  onFrame?: (el: HTMLIFrameElement | null) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    if (ref.current) ref.current.src = url;
    return () => {
      URL.revokeObjectURL(url);
      if (urlRef.current === url) urlRef.current = null;
    };
  }, [doc]);

  useEffect(() => {
    onFrame?.(ref.current);
    return () => onFrame?.(null);
  }, [onFrame]);

  return (
    <div className="flex justify-center">
      <iframe
        ref={ref}
        title="Živý náhľad projektu"
        sandbox={SANDBOX}
        className="rounded-xl border border-border bg-white"
        style={{ width, height, maxWidth: "100%" }}
      />
    </div>
  );
}
