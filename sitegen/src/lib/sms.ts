// Twilio SMS — https://www.twilio.com/docs/sms/send-messages
//
// For leads without an email but with a phone, SMS is the only outreach
// channel. The pipeline supports both — generate-outreach picks SMS for
// any lead that has phone + no email.

const BASE = "https://api.twilio.com/2010-04-01";

export async function sendSms(opts: {
  to: string;
  body: string;
}): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Twilio not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)",
    );
  }

  const normalized = normalizePhone(opts.to);
  if (!normalized) throw new Error(`invalid phone: ${opts.to}`);

  const url = `${BASE}/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: normalized,
    From: from,
    Body: opts.body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { sid: string };
  return { sid: json.sid };
}

// Twilio requires E.164 format (+15551234567). Google Places returns national
// or international formats — we normalize US numbers, pass through anything
// already E.164.
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^\+\d{8,15}$/.test(trimmed.replace(/[\s().-]/g, ""))) {
    return trimmed.replace(/[\s().-]/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
