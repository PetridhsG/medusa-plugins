/**
 * POST /admin/email-templates/test — send a test email to verify delivery is working.
 * Body: { to: string }
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_TEMPLATE_MODULE } from "../../../../modules/email-templates"
import EmailTemplateModuleService from "../../../../modules/email-templates/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { to } = req.body as { to: string }
  if (!to) return res.status(400).json({ message: "to is required" })

  const service: EmailTemplateModuleService = req.scope.resolve(EMAIL_TEMPLATE_MODULE)
  await service.sendTestEmail(to)
  res.json({ success: true, sent_to: to })
}
