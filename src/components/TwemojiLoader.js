"use client";

import Script from 'next/script';

export default function TwemojiLoader() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/twemoji@latest/dist/twemoji.min.js"
      strategy="afterInteractive"
      onReady={() => {
        if (typeof window !== 'undefined' && window.twemoji) {
          window.twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
          const observer = new MutationObserver(() => {
            window.twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
          });
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }}
    />
  );
}
