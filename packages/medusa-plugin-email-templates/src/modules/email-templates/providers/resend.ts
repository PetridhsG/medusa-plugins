/* Resend delivery provider. Set EMAIL_PROVIDER=resend and configure RESEND_* env vars. */
import { Resend } from "resend"
import type { EmailProvider, SendEmailOptions } from "./types"

export interface ResendProviderConfig {
  apiKey: string
  from: string
  testTo?: string /* when set and NODE_ENV !== "production", all emails go here */
}

export class ResendProvider implements EmailProvider {
  private resend: Resend
  private from: string
  private testTo?: string

  constructor(config: ResendProviderConfig) {
    this.resend = new Resend(config.apiKey)
    this.from   = config.from
    this.testTo = config.testTo
  }

  private recipient(to: string): string {
    return process.env.NODE_ENV !== "production" && this.testTo ? this.testTo : to
  }

  async send(options: SendEmailOptions): Promise<void> {
    const payload: Parameters<typeof this.resend.emails.send>[0] = {
      from:    this.from,
      to:      this.recipient(options.to),
      subject: options.subject,
      html:    options.html,
    }

    if (options.attachmentUrl) {
      payload.attachments = [{ path: options.attachmentUrl, filename: "attachment.pdf" }]
    }

    const { error } = await this.resend.emails.send(payload)
    if (error) throw new Error(`[resend] ${error.message}`)
  }

  async sendTest(to: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from:    this.from,
      to,
      subject: "Test email — medusa-plugin-email-templates",
      html:    "<p>Email delivery is working correctly.</p>",
    })
    if (error) throw new Error(`[resend] ${error.message}`)
  }
}
