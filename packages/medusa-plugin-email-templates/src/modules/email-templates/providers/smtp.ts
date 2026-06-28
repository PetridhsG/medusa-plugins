/* SMTP delivery provider via nodemailer. Works with Postmark, SendGrid, Mailgun, self-hosted. */
/* Set EMAIL_PROVIDER=smtp and configure SMTP_* env vars. */
import nodemailer from "nodemailer"
import type { EmailProvider, SendEmailOptions } from "./types"

export interface SMTPProviderConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure?: boolean /* defaults to true when port=465, false otherwise */
  testTo?: string /* when set and NODE_ENV !== "production", all emails go here */
}

export class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter
  private from: string
  private testTo?: string

  constructor(config: SMTPProviderConfig) {
    this.transporter = nodemailer.createTransport({
      host:   config.host,
      port:   config.port,
      secure: config.secure ?? config.port === 465,
      auth:   { user: config.user, pass: config.pass },
    })
    this.from   = config.from
    this.testTo = config.testTo
  }

  private recipient(to: string): string {
    return process.env.NODE_ENV !== "production" && this.testTo ? this.testTo : to
  }

  async send(options: SendEmailOptions): Promise<void> {
    const mail: nodemailer.SendMailOptions = {
      from:    this.from,
      to:      this.recipient(options.to),
      subject: options.subject,
      html:    options.html,
    }

    if (options.attachmentUrl) {
      const res    = await fetch(options.attachmentUrl)
      const buffer = Buffer.from(await res.arrayBuffer())
      mail.attachments = [{ filename: "attachment.pdf", content: buffer }]
    }

    await this.transporter.sendMail(mail)
  }

  async sendTest(to: string): Promise<void> {
    await this.transporter.sendMail({
      from:    this.from,
      to,
      subject: "Test email — medusa-plugin-email-templates",
      html:    "<p>Email delivery is working correctly.</p>",
    })
  }
}
