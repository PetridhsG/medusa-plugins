# medusa-plugin-email-templates

Database-backed Handlebars email templates for **Medusa v2** with pluggable delivery (Resend or SMTP).

- Store and edit templates in the database — no redeployment needed
- Handlebars rendering with any custom variables
- Send via **Resend** or any **SMTP server** (Postmark, SendGrid, Mailgun, self-hosted)
- Dev redirect — send all emails to a test address outside production
- Admin REST API for full template CRUD and delivery testing

---

## Requirements

- Medusa `>=2.14.0`
- Node `>=20`
- PostgreSQL

---

## Installation

```bash
npm install @petridhsg/medusa-plugin-email-templates resend       # Resend provider
# or
npm install @petridhsg/medusa-plugin-email-templates nodemailer   # SMTP provider
```

---

## Setup

### 1. Register in `medusa-config.ts`

Both entries are required: `plugins` loads the admin API routes; `modules` registers the database module.

```ts
import { defineConfig } from "@medusajs/framework/config"
import { EmailTemplateModule } from "@petridhsg/medusa-plugin-email-templates"

export default defineConfig({
  plugins: [
    { resolve: "@petridhsg/medusa-plugin-email-templates" },
  ],

  modules: [
    { resolve: EmailTemplateModule },
  ],
})
```

### 2. Set environment variables

**Resend** (default — used when `EMAIL_PROVIDER` is unset or `"resend"`):

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=no-reply@yourdomain.com
EMAIL_TEST_TO=dev@example.com   # optional: redirect all emails here outside production
```

**SMTP** (Postmark, SendGrid, Mailgun, self-hosted):

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM=no-reply@yourdomain.com
EMAIL_TEST_TO=dev@example.com   # optional
# SMTP_SECURE=true              # force TLS; auto-set when SMTP_PORT=465
```

### 3. Run migrations

```bash
npx medusa db:migrate
```

Creates the `email_template` table with `type`, `locale`, `name`, `subject`, and `body` columns.

---

## Sending email

Resolve the service from the DI container inside any subscriber, workflow step, or API route:

```ts
import { EMAIL_TEMPLATE_MODULE } from "@petridhsg/medusa-plugin-email-templates"

// Inside a subscriber or workflow step:
const emailService = container.resolve(EMAIL_TEMPLATE_MODULE)

await emailService.sendEmail(
  "order.placed",           // template type key — must match a stored template
  "en",                     // locale
  customer.email,           // recipient
  {                         // Handlebars variables
    customer_name: customer.first_name,
    order_id:      order.display_id,
    total:         "€49.99",
  },
  "https://cdn.example.com/invoice.pdf"  // optional: publicly accessible attachment URL
)
```

---

## Admin REST API

All routes require a Medusa admin session.

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/email-templates` | List all templates |
| `POST` | `/admin/email-templates` | Create a template |
| `GET` | `/admin/email-templates/:id` | Get a template |
| `POST` | `/admin/email-templates/:id` | Update a template |
| `DELETE` | `/admin/email-templates/:id` | Delete a template |
| `POST` | `/admin/email-templates/test` | Send a test delivery email |

### Create a template

```json
POST /admin/email-templates
{
  "type": "order.placed",
  "locale": "en",
  "name": "Order confirmation (EN)",
  "subject": "Your order #{{order_id}} is confirmed",
  "body": "<h1>Hi {{customer_name}},</h1><p>Order #{{order_id}} — Total: {{total}}</p>"
}
```

### Test delivery

```json
POST /admin/email-templates/test
{ "to": "you@example.com" }
```

---

## Template syntax

Both `subject` and `body` are rendered with [Handlebars](https://handlebarsjs.com/). Any variables you pass to `sendEmail` are available.

```handlebars
Subject: Your order #{{order_id}} is on its way!

<h1>Hi {{customer_name}},</h1>
<p>Your order will arrive by {{delivery_date}}.</p>
{{#if tracking_url}}
  <a href="{{tracking_url}}">Track your package</a>
{{/if}}
```

---

## License

MIT
