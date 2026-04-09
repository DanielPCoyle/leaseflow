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
  const { agentId, title, description, dueDate, priority } = body;

  if (!agentId || !title) {
    return badRequest("agentId and title are required");
  }

  // Verify prospect and agent belong to company
  const [prospect, agent] = await Promise.all([
    prisma.prospect.findFirst({ where: { id, companyId: user.companyId } }),
    prisma.agent.findFirst({ where: { id: agentId, companyId: user.companyId } }),
  ]);

  if (!prospect) return badRequest("Prospect not found");
  if (!agent) return badRequest("Agent not found");

  const task = await prisma.agentTask.create({
    data: {
      agentId,
      prospectId: id,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "NORMAL",
    },
    include: {
      agent: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
