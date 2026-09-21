/**
 * Safe Template Renderer
 *
 * Enforces:
 * 1. Strict variable schema validation before rendering.
 * 2. Channel-appropriate escaping (HTML entity encoding to prevent XSS/injection).
 * 3. Both HTML and plain-text fallback representations for emails.
 */

import { TemplateDefinition, InAppRenderResult, WhatsAppRenderResult, EmailRenderResult } from "./definition";

export class TemplateValidationError extends Error {
  constructor(
    public readonly templateKey: string,
    public readonly validationErrors: unknown
  ) {
    super(`Validation failed for template "${templateKey}": ${JSON.stringify(validationErrors)}`);
    this.name = "TemplateValidationError";
  }
}

/**
 * Escapes characters with special meaning in HTML to prevent markup/script injection.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates template input against its schema and renders content for the requested channel.
 */
export function renderTemplate<TVariables>(
  template: TemplateDefinition<TVariables>,
  rawVariables: unknown
): {
  inApp: InAppRenderResult;
  whatsApp: WhatsAppRenderResult;
  email: EmailRenderResult;
} {
  const parseResult = template.schema.safeParse(rawVariables);
  if (!parseResult.success) {
    throw new TemplateValidationError(template.key, parseResult.error.format());
  }

  const validated = parseResult.data;

  return {
    inApp: template.renderInApp(validated),
    whatsApp: template.renderWhatsApp(validated),
    email: template.renderEmail(validated),
  };
}
