/**
 * Notification Template Definitions
 *
 * Enforces strong typing, channel support, and versioning across templates.
 * INVARIANT: Templates receive only the minimum variables needed for rendering.
 */

import { z } from "zod";
import { NotificationCategory } from "../domain/category";
import { NotificationChannel } from "../domain/channel";
import { NotificationActionType } from "../domain/notification";

export interface InAppRenderResult {
  title: string;
  body: string;
  actionType?: NotificationActionType;
  actionTarget?: string;
}

export interface WhatsAppRenderResult {
  templateName: string;
  parameters: Record<string, string>;
}

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateDefinition<TVariables = unknown> {
  key: string;
  version: number;
  category: NotificationCategory;
  supportedChannels: readonly NotificationChannel[];
  schema: z.ZodType<TVariables>;
  renderInApp: (variables: TVariables) => InAppRenderResult;
  renderWhatsApp: (variables: TVariables) => WhatsAppRenderResult;
  renderEmail: (variables: TVariables) => EmailRenderResult;
}
