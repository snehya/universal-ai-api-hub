'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart2, CheckCircle2, XCircle, Clock, Zap, Cpu, RefreshCw, FileText, Play } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConnectorStatsPage({ params }: PageProps) {
  const { id } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/connectors/${id}/stats`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        setError(resData.error?.message || 'Failed to load statistics');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching connector statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-base text-slate-600 font-medium">Calculating usage statistics from request logs...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="p-5 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">{error || 'Connector statistics unavailable'}</div>
      </div>
    );
  }

  const { connector, stats, recentRequests } = data;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return 'Never';
    const date = new Date(isoStr);
    return date.toLocaleString();
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{connector.name} Usage Statistics</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            className="p-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition shadow-sm"
            title="Refresh Statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href={`/connectors/${connector.id}/docs`}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <FileText className="w-4 h-4" /> Documentation
          </Link>
          <Link
            href={`/connectors/${connector.id}/test`}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow transition"
          >
            <Play className="w-4 h-4 fill-white" /> Test API
          </Link>
        </div>
      </div>

      {/* OVERVIEW CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        {/* Total Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Total Requests</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.totalRequests}</span>
        </div>

        {/* Successful Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Successful</span>
          <span className="text-3xl font-black text-green-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6" /> {stats.successfulRequests}
          </span>
        </div>

        {/* Failed Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Failed</span>
          <span className="text-3xl font-black text-red-600 mt-1 flex items-center gap-1.5">
            <XCircle className="w-6 h-6" /> {stats.failedRequests}
          </span>
        </div>

        {/* Success Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Success Rate</span>
          <span className="text-3xl font-black text-blue-600 mt-1 block">
            {stats.totalRequests > 0 ? `${stats.successRate}%` : 'N/A'}
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Avg Response Time</span>
          <span className="text-3xl font-black text-amber-600 mt-1 flex items-center gap-1.5">
            <Clock className="w-6 h-6" /> {stats.avgResponseTimeMs} ms
          </span>
        </div>
      </div>

      {/* DETAILED USAGE METRICS & COST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Token Usage & Cost */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-6 h-6 text-amber-500" /> Token Usage &amp; Cost
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Input Tokens:</span>
              <span className="font-mono font-bold text-slate-900 text-base">{stats.totalInputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Output Tokens:</span>
              <span className="font-mono font-bold text-slate-900 text-base">{stats.totalOutputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Total Tokens:</span>
              <span className="font-mono font-bold text-blue-600 text-base">{stats.totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-medium">Estimated Cost:</span>
              <span className="font-mono font-bold text-emerald-600 text-base">{stats.estimatedCost}</span>
            </div>
          </div>
        </div>

        {/* Timestamps & Provider Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-6 h-6 text-purple-600" /> Activity &amp; Provider Metadata
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">First Used:</span>
              <span className="font-mono font-bold text-slate-900">{formatDate(stats.firstUsed)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Last Used:</span>
              <span className="font-mono font-bold text-slate-900">{formatDate(stats.lastUsed)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Provider:</span>
              <span className="font-bold text-slate-900 uppercase">{connector.provider}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-medium">Model:</span>
              <span className="font-mono font-bold text-slate-900">{connector.model}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT REQUESTS TABLE & ERROR LOGS */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Recent Requests ({recentRequests.length})
        </h2>

        {recentRequests.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">No request logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Latency</th>
                  <th className="py-3.5 px-4">Provider / Model</th>
                  <th className="py-3.5 px-4">Tokens (In / Out / Total)</th>
                  <th className="py-3.5 px-4">Error Info (if failed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {formatDate(req.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                          req.success
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {req.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {req.responseTimeMs} ms
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold uppercase mr-1.5 text-slate-800">{req.provider}</span>
                      <span className="font-mono text-slate-500">{req.model}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {req.inputTokens ?? '-'} / {req.outputTokens ?? '-'} /{' '}
                      <span className="font-extrabold text-slate-900">{req.totalTokens ?? '-'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {!req.success ? (
                        <div className="text-red-600 font-mono text-[11px] max-w-xs truncate">
                          <span className="font-bold">{req.errorType || 'ERROR'}:</span> {req.errorMessage || 'Execution failed'}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
