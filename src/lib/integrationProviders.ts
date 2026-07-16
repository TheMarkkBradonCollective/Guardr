export interface IntegrationConnectionStatus {
  configured: boolean;
}

export interface IntegrationHealth {
  twilio: IntegrationConnectionStatus;
  checkr: IntegrationConnectionStatus;
  insuranceApi: IntegrationConnectionStatus;
}

export const INTEGRATION_ENV_HINTS = {
  twilio: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in env, then redeploy.',
  checkr: 'Add CHECKR_API_KEY in env, then redeploy.',
  insuranceApi: 'Add INSURANCE_VERIFICATION_API_KEY in env, then redeploy.',
} as const;
