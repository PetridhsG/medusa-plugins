/**
 * GET  /admin/email-templates — list all templates ordered by type + locale.
 * POST /admin/email-templates — create a new template.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_TEMPLATE_MODULE } from "../../../modules/email-templates"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(EMAIL_TEMPLATE_MODULE)
  const templates = await service.listEmailTemplates({}, { order: { type: "ASC", locale: "ASC" } })
  res.json({ email_templates: templates })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as { type: string; locale: string; name: string; subject: string; body: string }

  if (!body.type || !body.locale || !body.name || !body.subject || !body.body) {
    return res.status(400).json({ message: "type, locale, name, subject and body are required" })
  }

  const service: any = req.scope.resolve(EMAIL_TEMPLATE_MODULE)
  const template = await service.createEmailTemplates(body)
  res.status(201).json({ email_template: template })
}
