export type ClientEmbeddedPaymentKind = 'job_payment' | 'overtime' | 'schedule_change' | 'tip';

export type GuardrStripePaymentRequest = {
  kind: ClientEmbeddedPaymentKind;
  jobId: string;
  clientEmail: string;
  jobTitle?: string;
  amountCents: number;
};

export type ClientReviewTipPayment = {
  jobId: string;
  amountCents: number;
  jobTitle?: string;
};

export type ClientReviewSubmitResult = {
  tipPayment?: ClientReviewTipPayment;
};
