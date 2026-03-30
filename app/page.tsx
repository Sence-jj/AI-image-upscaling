'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quota, setQuota] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchQuota();
      const ref = searchParams.get('ref');
      if (ref) {
        processInvite(ref);
      }
    }
  }, [status]);

  const fetchQuota = async () => {
    const res = await fetch('/api/user/profile');
    const data = await res.json();
    setQuota(data.quota);
  };

  const processInvite = async (code: string) => {
    await fetch('/api/invite/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session?.user?.id, inviteCode: code }),
    });
    fetchQuota();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'authenticated') {
      alert('请先登录');
      return;
    }

    const totalQuota = (quota?.free || 0) + (quota?.paid || 0);
    if (totalQuota <= 0) {
      alert('额度不足，请邀请好友或购买次数包');
      router.push('/dashboard');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('文件过大，免费版最大支持 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setOriginal(evt.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upscale', formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percent);
        },
      });
      setResult(response.data.url);
      fetchQuota();
    } catch (error: any) {
      if (error.response?.data?.error === 'quota_exceeded') {
        alert('额度不足');
        router.push('/dashboard');
      } else {
        alert('处理失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalQuota = (quota?.free || 0) + (quota?.paid || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">🖼️ AI Image Upscaling</h1>
            <p className="text-gray-600 mt-2">登录后免费使用</p>
          </div>
          <div>
            {status === 'authenticated' ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">剩余额度</div>
                  <div className="text-2xl font-bold text-blue-600">{totalQuota} 次</div>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  个人中心
                </button>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Google 登录
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">原图</h2>
            <div
              onClick={() => status === 'authenticated' && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                status === 'authenticated'
                  ? 'border-blue-300 cursor-pointer hover:border-blue-500'
                  : 'border-gray-300 cursor-not-allowed bg-gray-50'
              } transition`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={status !== 'authenticated'}
              />
              {original ? (
                <img src={original} alt="Original" className="max-w-full h-auto" />
              ) : (
                <div className="text-gray-500">
                  {status === 'authenticated' ? (
                    <>
                      <p className="text-lg mb-2">拖拽或点击上传图片</p>
                      <p className="text-sm">支持 JPG, PNG, WebP (最大 5MB)</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2">🔒 请先登录</p>
                      <p className="text-sm">登录后即可免费使用</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">超分后</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-gray-600">{progress}%</p>
              </div>
            ) : result ? (
              <div>
                <img src={result} alt="Upscaled" className="max-w-full h-auto mb-4" />
                <a
                  href={result}
                  download="upscaled.png"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-center block transition"
                >
                  ⬇️ 下载高清图
                </a>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                上传图片后显示结果
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
