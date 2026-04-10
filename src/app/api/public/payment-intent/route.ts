import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeEnabled } from "@/lib/stripe";

/**
 * Create a Stripe payment intent for an application fee.
 * POST /api/public/payment-intent
 * Body: { propertyId, applicantEmail }
 */
export async function POST(request: NextRequest) {
  if (!isStripeEnabled() || !stripe) {
    // Dev fallback: return a mock success so forms can still work
    return NextResponse.json({
      clientSecret: "dev_mode_no_stripe",
      devMode: true,
    });
  }

  const body = await request.json();
  const { propertyId, applicantEmail } = body;

  if (!propertyId || !applicantEmail) {
    return NextResponse.json(
      { error: "propertyId and applicantEmail required" },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { companyId: true, name: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { id: property.companyId },
    select: { settings: true, name: true },
  });

  const settings = company?.settings as Record<string, unknown> | null;
  const applicationFee = (settings?.applicationFee as number) || 50;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(applicationFee * 100), // cents
      currency: "usd",
      receipt_email: applicantEmail,
      description: `Application fee - ${property.name}`,
      metadata: {
        propertyId,
        companyId: property.companyId,
        companyName: company?.name || "",
        type: "application_fee",
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: applicationFee,
    });
  } catch (error) {
    console.error("[stripe] payment intent creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
