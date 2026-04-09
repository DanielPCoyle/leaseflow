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
  const { type, direction, subject, body: msgBody } = body;

  if (!type || !direction || !msgBody) {
    return badRequest("type, direction, and body are required");
  }

  // Verify prospect belongs to company
  const prospect = await prisma.prospect.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!prospect) return badRequest("Prospect not found");

  const communication = await prisma.communication.create({
    data: {
      prospectId: id,
      type,
      direction,
      subject: subject || null,
      body: msgBody,
    },
  });

  return NextResponse.json(communication, { status: 201 });
}
