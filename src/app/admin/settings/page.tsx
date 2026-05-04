'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckCircle, AlertCircle, Database, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ imported: number; updated: number; total: number } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        setLastSync(new Date().toLocaleString('zh-HK'));
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">系統設定</h1>
        <p className="text-sm text-gray-400 mt-1">管理同步設定與系統資訊</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* HKTVmall Sync */}
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
                  <p className="font-semibold">/tmp/megaoutlet_all_products.json</p>
                </div>
                <div>
                  <span className="text-gray-400">最後同步</span>
                  <p className="font-semibold">{lastSync || '從未同步'}</p>
                </div>
                <div>
                  <span className="text-gray-400">同步狀態</span>
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500" />
                    就緒
                  </p>
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

        {/* Cron job info */}
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
              建議時間：每晚 03:00 AM（HKTVmall 更新後）
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <p className="text-gray-500 mb-2">Vercel cronjob 配置 (vercel.json):</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">{`{
  "crons": [{
    "path": "/api/admin/sync",
    "schedule": "0 3 * * *"
  }]
}`}</pre>
          </div>
        </div>

        {/* Store info */}
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
              <span className="text-gray-400">默認登入</span>
              <p className="font-mono">admin@megaoutlet.com / admin123</p>
            </div>
            <div>
              <span className="text-gray-400">商品數據</span>
              <p className="font-semibold">176 個（已爬取）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}