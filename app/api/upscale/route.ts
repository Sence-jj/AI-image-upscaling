import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Please login first' }, { status: 401 });
  }

  const quota = await prisma.userQuota.findUnique({
    where: { userId: session.user.id },
  });

  const totalQuota = (quota?.freeQuota || 0) + (quota?.paidQuota || 0);
  if (totalQuota <= 0) {
    return NextResponse.json({ error: 'quota_exceeded' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // 调用 Python 后端处理
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const backendForm = new FormData();
    backendForm.append('file', new Blob([buffer]), file.name);

    const backendRes = await fetch(`${backendUrl}/upscale`, {
      method: 'POST',
      body: backendForm,
    });

    let resultUrl = `/uploads/${filename}`;
    if (backendRes.ok) {
      const data = await backendRes.json();
      resultUrl = data.url || resultUrl;
    }

    // 扣除额度（优先扣免费额度）
    if ((quota?.freeQuota || 0) > 0) {
      await prisma.userQuota.update({
        where: { userId: session.user.id },
        data: { freeQuota: { decrement: 1 } },
      });
    } else {
      await prisma.userQuota.update({
        where: { userId: session.user.id },
        data: { paidQuota: { decrement: 1 } },
      });
    }

    // 记录使用记录
    await prisma.upscaleRecord.create({
      data: {
        userId: session.user.id,
        originalFilename: file.name,
        originalSize: file.size,
        scaleFactor: 4,
        status: 'success',
        resultUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ url: resultUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
