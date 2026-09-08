import Twilio from "twilio";

export function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return null;
  return {
    client: Twilio(sid, token),
    from,
  };
}

export async function sendSms(
  to: string,
  body: string
): Promise<void> {
  const twilio = getTwilioClient();
  if (!twilio) {
    throw new Error(
      "Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER."
    );
  }
  await twilio.client.messages.create({
    to,
    from: twilio.from,
    body,
  });
}

export async function sendSmsBlast(
  phones: string[],
  body: string
): Promise<{ sent: number; failed: { phone: string; error: string }[] }> {
  const failed: { phone: string; error: string }[] = [];
  let sent = 0;

  for (const phone of phones) {
    try {
      await sendSms(phone, body);
      sent++;
    } catch (e) {
      failed.push({
        phone,
        error: e instanceof Error ? e.message : "Send failed",
      });
    }
  }

  return { sent, failed };
}
