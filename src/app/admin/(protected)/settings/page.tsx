'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Clock, CheckCircle, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ imported: number; updated: number; total: number } | null>(null);
  const [syncedTotal, setSyncedTotal] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedProducts, setUploadedProducts] = useState<any[] | null>(null);

  const refreshSyncedTotal = async () => {
    try {
      const res = await fetch('/api/products?limit=1&page=1', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && typeof data.total === 'number') {
        setSyncedTotal(data.total);
      }
    } catch {}
  };

  useEffect(() => {
    refreshSyncedTotal();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: uploadedProducts ? JSON.stringify({ products: uploadedProducts }) : undefined,
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        setLastSync(new Date().toLocaleString('zh-HK'));
        await refreshSyncedTotal();
        toast.success(`同步完成！導入 ${data.imported}，更新 ${data.updated}`);
      } else {
        toast.error(data.error || '同步失敗');
      }
    } catch {
      toast.error('同步請求失敗');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const products = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.products) ? parsed.products : null;
      if (!products) {
        toast.error('JSON 格式不正確：需要 array 或 { products: array }');
        return;
      }
      setUploadedFileName(file.name);
      setUploadedProducts(products);
      toast.success(`已載入爬蟲檔案：${products.length} 件商品`);
    } catch {
      toast.error('讀取檔案失敗：請確認係有效 JSON');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">系統設定</h1>
        <p className="text-sm text-gray-400 mt-1">管理同步設定與系統資訊</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <RefreshCw size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-dark">HKTVmall 商品同步</h2>
              <p className="text-sm text-gray-400">從 HKTVmall 爬蟲數據同步商品到網店</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">商店</span>
                  <p className="font-semibold">MEGA OUTLET (H9456001)</p>
                </div>
                <div>
                  <span className="text-gray-400">數據來源</span>
                  <p className="font-semibold">{uploadedFileName || '未上傳（Production 不會有 /tmp 檔）'}</p>
                </div>
                <div>
                  <span className="text-gray-400">最後同步</span>
                  <p className="font-semibold">
                    {lastSync || (syncedTotal && syncedTotal > 0 ? '已同步（沒有同步時間記錄）' : '從未同步')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">已同步商品</span>
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500" />
                    {syncedTotal ?? '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-500">上傳爬蟲 JSON 檔案（array 或 {`{ products: [...] }`}）</div>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                  }}
                  className="block w-full text-sm"
                />
                <div className="text-sm text-gray-400">
                  {uploadedProducts ? `已載入：${uploadedProducts.length} 件` : '未載入檔案'}
                </div>
              </div>
            </div>

            {syncResult && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} /> 同步結果
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{syncResult.imported}</p>
                    <p className="text-green-600">新導入</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{syncResult.updated}</p>
                    <p className="text-green-600">已更新</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{syncResult.total}</p>
                    <p className="text-green-600">總商品</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary w-full py-3"
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  同步中...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  立即同步 HKTVmall 商品
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="font-bold text-dark">自動同步排程</h2>
              <p className="text-sm text-gray-400">設置每晚自動同步 HKTVmall 商品</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              自動同步可通過 Vercel Cronjob 或外部伺服器上的 cron job 設置。
              目前已配置在 vercel.json，每日 19:00 觸發一次（香港時間）
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <p className="text-gray-500 mb-2">Vercel cronjob 配置 (vercel.json):</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">{`{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "0 19 * * *"
  }]
}`}</pre>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Globe size={20} className="text-purple-500" />
            </div>
            <div>
              <h2 className="font-bold text-dark">商店資訊</h2>
              <p className="text-sm text-gray-400">店鋪基本配置</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">商店名稱</span>
              <p className="font-semibold">MEGA OUTLET</p>
            </div>
            <div>
              <span className="text-gray-400">商店代碼</span>
              <p className="font-mono">H9456001</p>
            </div>
            <div>
              <span className="text-gray-400">商品數據</span>
              <p className="font-semibold">
                已同步：{syncedTotal ?? '-'}{uploadedProducts ? `；已載入爬蟲：${uploadedProducts.length}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
