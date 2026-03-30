'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    const res = await fetch('/api/user/profile');
    const data = await res.json();
    setProfile(data);
  };

  const generateInvite = async () => {
    const res = await fetch('/api/invite/generate', { method: 'POST' });
    const data = await res.json();
    setInviteUrl(data.inviteUrl);
  };

  if (status === 'loading' || !profile) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const totalQuota = profile.quota.free + profile.quota.paid;
  const canInvite = profile.quota.inviteCount < 5;
  const remainingInvites = 5 - profile.quota.inviteCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <img src={profile.image} alt="Avatar" className="w-16 h-16 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">🎁 我的额度</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalQuota} 次</div>
              <div className="text-sm text-gray-600">
                免费额度: {profile.quota.free} 次 | 付费额度: {profile.quota.paid} 次
              </div>
              {profile.quota.inviteEarned > 0 && (
                <div className="text-sm text-green-600 mt-1">
                  通过邀请获得: {profile.quota.inviteEarned} 次
                </div>
              )}
            </div>

            {canInvite && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm mb-2">
                  💡 邀请好友注册，双方各得 <strong>2 次</strong> 免费额度
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  还可邀请 {remainingInvites} 人获得 {remainingInvites * 2} 次额度
                </p>
                <button
                  onClick={generateInvite}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  生成邀请链接
                </button>
                {inviteUrl && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="w-full text-sm"
                      onClick={(e) => e.currentTarget.select()}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
}
