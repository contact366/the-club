"use client";
export default function Emoji({ symbol, label, size = 24 }) {
  const codePoint = [...symbol].map(c => c.codePointAt(0).toString(16)).join('-');
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoint}.svg`}
      alt={label || symbol}
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }}
      draggable={false}
    />
  );
}
