/* Registers the email-templates module. */
import { Module } from "@medusajs/framework/utils"
import EmailTemplateModuleService from "./service"

export const EMAIL_TEMPLATE_MODULE = "emailTemplate"

export default Module(EMAIL_TEMPLATE_MODULE, {
  service: EmailTemplateModuleService,
})
