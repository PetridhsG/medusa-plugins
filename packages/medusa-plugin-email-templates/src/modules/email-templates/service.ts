/**
 * Loads Handlebars templates from the database, renders them, and delivers via
 * the configured provider (Resend or SMTP). Provider is selected by EMAIL_PROVIDER env var.
 */
import { MedusaService } from "@medusajs/framework/utils"
import Handlebars from "handlebars"
import EmailTemplate from "./models/email-template"
import { ResendProvider } from "./providers/resend"
import { SMTPProvider } from "./providers/smtp"
import type { EmailProvider } from "./providers/types"

class EmailTemplateModuleService extends MedusaService({ EmailTemplate }) {
  private provider: EmailProvider

  constructor(...args: any[]) {
    super(...args)
    this.provider = EmailTemplateModuleService.buildProvider()
  }

  private static buildProvider(): EmailProvider {
    const providerType = (process.env.EMAIL_PROVIDER || "resend").toLowerCase()

    if (providerType === "resend") {
      return new ResendProvider({
        apiKey: process.env.RESEND_API_KEY || "",
        from:   process.env.RESEND_FROM    || "onboarding@resend.dev",
        testTo: process.env.EMAIL_TEST_TO  || process.env.RESEND_TEST_TO,
      })
    }

    if (providerType === "smtp") {
      const port = parseInt(process.env.SMTP_PORT || "587", 10)
      return new SMTPProvider({
        host:   process.env.SMTP_HOST   || "",
        port,
        user:   process.env.SMTP_USER   || "",
        pass:   process.env.SMTP_PASS   || "",
        from:   process.env.SMTP_FROM   || process.env.RESEND_FROM || "",
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        testTo: process.env.EMAIL_TEST_TO,
      })
    }

    throw new Error(
      `[email-templates] Unknown EMAIL_PROVIDER="${providerType}". Supported values: "resend", "smtp".`
    )
  }

  private compile(template: string, variables: Record<string, any>): string {
    return Handlebars.compile(template)(variables)
  }

  async sendEmail(
    type: string,
    locale: string,
    to: string,
    variables: Record<string, any> = {},
    attachmentUrl?: string
  ): Promise<void> {
    const [template] = await this.listEmailTemplates({ type, locale } as any, { take: 1 })
    if (!template) throw new Error(`Email template not found: type="${type}" locale="${locale}"`)

    await this.provider.send({
      to,
      subject: this.compile(template.subject, variables),
      html:    this.compile(template.body, variables),
      attachmentUrl,
    })
  }

  async sendTestEmail(to: string): Promise<void> {
    await this.provider.sendTest(to)
  }
}

export default EmailTemplateModuleService
