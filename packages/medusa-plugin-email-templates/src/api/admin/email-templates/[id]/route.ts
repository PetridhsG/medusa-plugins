/**
 * GET    /admin/email-templates/:id — retrieve a single template.
 * POST   /admin/email-templates/:id — update fields on an existing template.
 * DELETE /admin/email-templates/:id — delete a template.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_TEMPLATE_MODULE } from "../../../../modules/email-templates"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(EMAIL_TEMPLATE_MODULE)
  const template = await service.retrieveEmailTemplate(req.params.id)
  res.json({ email_template: template })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as { type?: string; locale?: string; name?: string; subject?: string; body?: string }
  const service: any = req.scope.resolve(EMAIL_TEMPLATE_MODULE)
  const template = await service.updateEmailTemplates({ id: req.params.id, ...body })
  res.json({ email_template: template })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(EMAIL_TEMPLATE_MODULE)
  await service.deleteEmailTemplates(req.params.id)
  res.json({ id: req.params.id, deleted: true })
}
