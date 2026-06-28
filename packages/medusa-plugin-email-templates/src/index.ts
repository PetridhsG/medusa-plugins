/* Plugin entry point — exports module key, default registration, and provider types. */
export { EMAIL_TEMPLATE_MODULE, default as EmailTemplateModule } from "./modules/email-templates"
export type { EmailProvider, SendEmailOptions } from "./modules/email-templates/providers/types"
