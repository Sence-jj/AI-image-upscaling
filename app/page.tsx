'use client';

import { useState, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    } catch (error) {
      alert('处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          AI 图片超分
        </h1>
        <p className="text-center text-gray-600 mb-12">
          使用 Real-ESRGAN 将低分辨率图片转换为高清版本
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 上传区域 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">原图</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              {original ? (
                <img src={original} alt="Original" className="max-w-full h-auto" />
              ) : (
                <div className="text-gray-500">
                  <p className="text-lg mb-2">拖拽或点击上传图片</p>
                  <p className="text-sm">支持 JPG, PNG, WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* 结果区域 */}
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
