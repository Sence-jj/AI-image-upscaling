import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = generateCode();
  
  await prisma.invitation.create({
    data: {
      inviterId: session.user.id,
      inviteCode: code,
    },
  });

  return NextResponse.json({
    inviteCode: code,
    inviteUrl: `${process.env.NEXTAUTH_URL}?ref=${code}`,
  });
}
