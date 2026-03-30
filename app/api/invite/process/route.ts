import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { userId, inviteCode } = await request.json();

  if (!inviteCode) {
    return NextResponse.json({ success: true });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { inviteCode },
    include: { inviter: { include: { quota: true } } },
  });

  if (!invitation || invitation.status === "completed") {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  if (invitation.inviter.quota && invitation.inviter.quota.inviteCount >= 5) {
    return NextResponse.json({ error: "Invite limit reached" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { inviteeId: userId, status: "completed", completedAt: new Date() },
    }),
    prisma.userQuota.update({
      where: { userId: invitation.inviterId },
      data: { 
        freeQuota: { increment: 2 },
        inviteEarned: { increment: 2 },
        inviteCount: { increment: 1 },
      },
    }),
    prisma.userQuota.update({
      where: { userId },
      data: { freeQuota: { increment: 2 } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
