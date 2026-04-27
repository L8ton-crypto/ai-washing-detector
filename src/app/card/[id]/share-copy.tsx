"use client";

import { useEffect, useRef, useState } from "react";

export default function ShareCopy({ id }: { id: number }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [absUrl, setAbsUrl] = useState<string>(`/card/${id}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAbsUrl(`${window.location.origin}/card/${id}`);
    }
  }, [id]);

  const copy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(absUrl);
      } else if (inputRef.current) {
        inputRef.current.select();
        document.execCommand("copy");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col sm:flex-row gap-2">
      <input
        ref={inputRef}
        readOnly
        value={absUrl}
        aria-label="Share URL"
        className="flex-1 bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-xs text-gray-300 font-mono"
      />
      <button
        type="button"
        onClick={copy}
        className="rounded-md px-3 py-2 text-xs font-medium bg-emerald-500 text-black hover:bg-emerald-400"
      >
        {copied ? "Copied" : "Copy URL"}
      </button>
    </div>
  );
}
