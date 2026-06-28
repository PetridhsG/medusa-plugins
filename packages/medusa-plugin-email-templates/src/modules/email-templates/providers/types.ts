/* Shared interface all email delivery providers must implement. */

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  attachmentUrl?: string /* publicly accessible URL; provider fetches + attaches the file */
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>
  sendTest(to: string): Promise<void>
}
