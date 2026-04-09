import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.companyId) return unauthorized();

  const companyId = user.companyId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    prospectsByStatus,
    tourStats,
    applicationStats,
    leaseStats,
    recentProspects,
    agentPerformance,
    propertyOccupancy,
  ] = await Promise.all([
    // Prospect pipeline
    prisma.prospect.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
    // Tour stats (last 30 days)
    prisma.tour.groupBy({
      by: ["status"],
      where: {
        property: { companyId },
        scheduledDate: { gte: thirtyDaysAgo },
      },
      _count: true,
    }),
    // Application stats
    prisma.application.groupBy({
      by: ["status"],
      where: { property: { companyId } },
      _count: true,
    }),
    // Lease stats
    prisma.lease.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
    // New prospects last 30 days
    prisma.prospect.count({
      where: { companyId, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Agent performance
    prisma.agent.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        user: { select: { name: true } },
        _count: {
          select: {
            tours: {
              where: {
                status: "COMPLETED",
                scheduledDate: { gte: thirtyDaysAgo },
              },
            },
          },
        },
      },
    }),
    // Property occupancy
    prisma.property.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        units: { select: { status: true, marketRent: true } },
      },
    }),
  ]);

  return NextResponse.json({
    prospectsByStatus: prospectsByStatus.reduce(
      (acc, s) => { acc[s.status] = s._count; return acc; },
      {} as Record<string, number>
    ),
    tourStats: tourStats.reduce(
      (acc, s) => { acc[s.status] = s._count; return acc; },
      {} as Record<string, number>
    ),
    applicationStats: applicationStats.reduce(
      (acc, s) => { acc[s.status] = s._count; return acc; },
      {} as Record<string, number>
    ),
    leaseStats: leaseStats.reduce(
      (acc, s) => { acc[s.status] = s._count; return acc; },
      {} as Record<string, number>
    ),
    recentProspects,
    agentPerformance: agentPerformance.map((a) => ({
      name: a.user.name,
      completedTours: a._count.tours,
    })).sort((a, b) => b.completedTours - a.completedTours),
    propertyOccupancy: propertyOccupancy.map((p) => {
      const total = p.units.length;
      const occupied = p.units.filter((u) => u.status === "OCCUPIED").length;
      const revenue = p.units
        .filter((u) => u.status === "OCCUPIED")
        .reduce((sum, u) => sum + (u.marketRent ?? 0), 0);
      return {
        name: p.name,
        total,
        occupied,
        rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
        revenue,
      };
    }),
  });
}
