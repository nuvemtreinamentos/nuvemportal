import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

export async function createPixPayment(amount: number, planId: string, userId: number) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "brl",
      payment_method_types: ["pix"],
      metadata: {
        planId,
        userId
      }
    });

    const pixDetails = paymentIntent.next_action?.pix_display_qr_code;

    if (!pixDetails) {
      throw new Error("Failed to generate PIX QR code");
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      pixQrCode: pixDetails.hosted_qr_code,
      pixKey: pixDetails.hosted_instructions_url,
      amount: paymentIntent.amount,
    };
  } catch (error) {
    throw new Error(
      `Failed to create PIX payment: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}