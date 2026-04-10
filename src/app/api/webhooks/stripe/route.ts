import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!isStripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const type = intent.metadata?.type;

      if (type === "application_fee") {
        // Find application by payment intent ID and mark fee as paid
        const app = await prisma.application.findFirst({
          where: { feePaymentId: intent.id },
        });
        if (app) {
          await prisma.application.update({
            where: { id: app.id },
            data: { applicationFee: intent.amount / 100 },
          });
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.error("[stripe] payment failed:", intent.id, intent.last_payment_error?.message);
      break;
    }
    default:
      // Ignore unhandled events
      break;
  }

  return NextResponse.json({ received: true });
}
