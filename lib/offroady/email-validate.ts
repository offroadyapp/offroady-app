/**
 * Email HTML validation utilities for weekly digest emails.
 * Used before sending to catch common issues like missing links, relative URLs, or broken structure.
 */

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validate a weekly digest email HTML string for common issues.
 * Checks:
 * - Presence of clickable links
 * - No relative hrefs (must be absolute URLs)
 * - Unsubscribe link present
 * - Valid HTML document structure
 * - All hrefs start with https://
 */
export function validateDigestEmailHtml(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check HTML is provided
  if (!html || (typeof html !== 'string')) {
    errors.push('HTML content is empty or not a string');
    return { valid: false, errors, warnings };
  }

  // Check for clickable links
  if (!html.includes('<a href="')) {
    errors.push('No clickable links found (<a href="...">)');
  }

  // Check for relative hrefs (href="/..." without protocol)
  const relativeMatches = html.match(/href="\/(?!\/)/g);
  if (relativeMatches) {
    errors.push(`Found ${relativeMatches.length} relative href(s) — all hrefs must be absolute URLs`);
    // Show first 3 for debugging
    const firstThree: string[] = [];
    const relRegex = /href="\/([^"]+)"/g;
    let match;
    let count = 0;
    while ((match = relRegex.exec(html)) !== null && count < 3) {
      firstThree.push(`/${match[1]}`);
      count++;
    }
    if (firstThree.length > 0) {
      errors.push(`First relative paths: ${firstThree.join(', ')}`);
    }
  }

  // Check for non-https hrefs (allow mailto: for unsubscribe)
  const httpMatches = html.match(/href="http:\/\//g);
  if (httpMatches) {
    warnings.push(`Found ${httpMatches.length} http:// URL(s) — should be https://`);
  }

  // Check for unsubscribe link
  if (!html.includes('unsubscribe')) {
    errors.push('Missing unsubscribe link/footer');
  }

  // Check for manage preferences link
  if (!html.includes('preferences') && !html.includes('preferences')) {
    warnings.push('Missing email preferences management link');
  }

  // Check for basic HTML document structure
  if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
    if (!html.includes('<html') && !html.includes('<HTML')) {
      errors.push('Not a complete HTML document (missing DOCTYPE and <html> tag)');
    }
  }

  // Check for table-based layout (recommended for email clients)
  if (!html.includes('<table') || !html.includes('<td')) {
    warnings.push('HTML may not use table-based layout — some email clients may not render correctly');
  }

  // Check for inline styles
  if (!html.includes('style=')) {
    warnings.push('No inline styles found — email clients may strip external CSS');
  }

  // Check meta viewport for mobile
  if (!html.includes('viewport')) {
    warnings.push('Missing viewport meta tag for mobile responsiveness');
  }

  // Check for broken template placeholders
  if (html.includes('<!--%%EMAIL_FOOTER%%-->')) {
    warnings.push('EMAIL_FOOTER placeholder was not replaced — email will show raw placeholder');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a text version of the email.
 */
export function validateDigestEmailText(text: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!text) {
    errors.push('Text content is empty');
    return { valid: false, errors, warnings };
  }

  // Check for unsubscribe
  if (!text.includes('Unsubscribe')) {
    warnings.push('Text version missing unsubscribe information');
  }

  // Check for bare URLs (should have http/https)
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount === 0) {
    warnings.push('Text version has no URLs');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
