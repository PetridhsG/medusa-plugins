/* Handlebars email template keyed by event type and locale. */
import { model } from "@medusajs/framework/utils"

const EmailTemplate = model.define("email_template", {
  id: model.id().primaryKey(),
  type: model.text(), /* event key, e.g. "order.placed" */
  locale: model.text(), /* e.g. "en", "de" */
  name: model.text(), /* human-readable label */
  subject: model.text(), /* Handlebars subject line */
  body: model.text(), /* Handlebars HTML body */
})

export default EmailTemplate
