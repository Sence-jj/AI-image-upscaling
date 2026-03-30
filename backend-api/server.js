import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 生成邀请码
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 获取用户信息
app.get('/api/user/profile', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { quota: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    quota: {
      free: user.quota?.freeQuota || 0,
      paid: user.quota?.paidQuota || 0,
      inviteEarned: user.quota?.inviteEarned || 0,
      inviteCount: user.quota?.inviteCount || 0,
    },
  });
});

export default app;

// 生成邀请链接
app.post('/api/invite/generate', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const code = generateCode();
  await prisma.invitation.create({
    data: { inviterId: userId, inviteCode: code },
  });

  res.json({
    inviteCode: code,
    inviteUrl: `${process.env.NEXTAUTH_URL}?ref=${code}`,
  });
});

// 处理邀请
app.post('/api/invite/process', async (req, res) => {
  const { userId, inviteCode } = req.body;
  if (!inviteCode) return res.json({ success: true });

  const invitation = await prisma.invitation.findUnique({
    where: { inviteCode },
    include: { inviter: { include: { quota: true } } },
  });

  if (!invitation || invitation.status === 'completed') {
    return res.status(400).json({ error: 'Invalid invite code' });
  }

  if (invitation.inviter.quota && invitation.inviter.quota.inviteCount >= 5) {
    return res.status(400).json({ error: 'Invite limit reached' });
  }

  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { inviteeId: userId, status: 'completed', completedAt: new Date() },
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

  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
