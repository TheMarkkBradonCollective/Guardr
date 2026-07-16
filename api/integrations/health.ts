import type { VercelRequest, VercelResponse } from '@vercel/node';

function twilioConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  return !!sid && !!token && !!from;
}

function checkrConfigured(): boolean {
  const key = process.env.CHECKR_API_KEY?.trim();
  return !!key && key !== 'checkr_placeholder';
}

function insuranceApiConfigured(): boolean {
  const key = process.env.INSURANCE_VERIFICATION_API_KEY?.trim();
  return !!key && key !== 'insurance_api_placeholder';
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    twilio: { configured: twilioConfigured() },
    checkr: { configured: checkrConfigured() },
    insuranceApi: { configured: insuranceApiConfigured() },
  });
}
