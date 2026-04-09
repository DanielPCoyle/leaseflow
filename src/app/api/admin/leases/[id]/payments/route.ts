import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { amount, type, dueDate, description } = body;

  if (!amount || !type) {
    return badRequest("amount and type are required");
  }

  const lease = await prisma.lease.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!lease) return badRequest("Lease not found");

  const payment = await prisma.payment.create({
    data: {
      leaseId: id,
      amount: parseFloat(amount),
      type,
      dueDate: dueDate ? new Date(dueDate) : null,
      description: description || null,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const body = await request.json();
  const { paymentId, status } = body;

  if (!paymentId || !status) {
    return badRequest("paymentId and status are required");
  }

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      ...(status === "SUCCEEDED" ? { paidAt: new Date() } : {}),
    },
  });

  return NextResponse.json(payment);
}
