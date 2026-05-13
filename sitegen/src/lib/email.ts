import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;

export const FROM = process.env.RESEND_FROM ?? "Sites <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!resend) throw new Error("RESEND_API_KEY not set");
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
