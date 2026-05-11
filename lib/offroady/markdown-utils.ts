// Shared markdown utilities
// Safe for both client and server imports

import type { Options as SanitizeOptions } from 'rehype-sanitize';

/**
 * rehype-sanitize schema for blog/story body rendering.
 * Blocks arbitrary HTML/iframe/script but allows standard markdown output
 * (p, h1-h6, ul, ol, li, a, img, strong, em, blockquote, hr, br, code, pre).
 */
export const SANITIZE_SCHEMA: SanitizeOptions = {
  tagNames: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'blockquote', 'hr', 'br',
    'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'figure', 'figcaption',
  ],
  attributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'loading', 'class'],
    '*': ['class', 'id'],
  },
  strip: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'style', 'link', 'meta'],
  allowComments: false,
  allowDoctypes: false,
};

/**
 * YouTube Video ID extraction from various URL formats.
 * Used in form validation and preview rendering.
 */
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
