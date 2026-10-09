'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Cpu, Eye, Edit3, Power, Trash2, CheckCircle2, XCircle, RefreshCw, Play, FileText, BarChart2 } from 'lucide-react';

interface ConnectorStats {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  provider: string;
  model: string;
  enabled: boolean;
  createdAt: string;
  inputs: any[];
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  firstUsed?: string | null;
  lastUsed?: string | null;
}

export default function DashboardPage() {
  const [connectors, setConnectors] = useState<ConnectorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/connectors');
      const data = await res.json();
      if (data.success) {
        setConnectors(data.data);
      } else {
        setError(data.error?.message || 'Failed to load connectors');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching connectors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/connectors/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectors(connectors.map((c) => (c.id === id ? { ...c, enabled: !currentStatus } : c)));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete connector "${name}"?`)) return;

    try {
      const res = await fetch(`/api/connectors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setConnectors(connectors.filter((c) => c.id !== id));
      } else {
        alert(data.error?.message || 'Failed to delete connector');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting connector');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-600 flex-shrink-0" />
            AI Connector Dashboard
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Manage your AI endpoints, configure input schemas, and monitor request metrics in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={fetchConnectors}
            className="p-2.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <Link
            href="/connectors/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow transition"
          >
            <PlusCircle className="w-5 h-5" />
            Create Connector
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-base text-slate-600 font-medium">Loading AI connectors...</p>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      ) : connectors.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <Cpu className="w-14 h-14 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">No AI Connectors Found</h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto mt-1">
              Get started by creating your first AI API connector with custom parameters and structured JSON output schemas.
            </p>
          </div>
          <Link
            href="/connectors/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow"
          >
            <PlusCircle className="w-5 h-5" /> Create First Connector
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[768px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Connector</th>
                  <th className="py-4 px-6">Provider / Model</th>
                  <th className="py-4 px-6">Inputs</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Requests (Succ / Fail)</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {connectors.map((connector) => (
                  <tr key={connector.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6">
                      <Link
                        href={`/connectors/${connector.id}`}
                        className="font-bold text-slate-900 text-base hover:text-blue-600 transition"
                      >
                        {connector.name}
                      </Link>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">/api/connectors/{connector.slug}</div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                            connector.provider === 'gemini'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {connector.provider.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {connector.model}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap">
                      {connector.inputs?.length || 0} fields
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                          connector.enabled
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {connector.enabled ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-400" /> Disabled
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-700 font-mono text-xs whitespace-nowrap">
                      <div className="font-bold text-sm text-slate-900">
                        {connector.totalRequests} total
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        <span className="text-green-600">{connector.successfulRequests} succ</span> /{' '}
                        <span className="text-red-600">{connector.failedRequests} fail</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/connectors/${connector.id}/test`}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded-lg flex items-center gap-1.5 transition"
                          title="Test API Endpoint"
                        >
                          <Play className="w-3.5 h-3.5 fill-blue-700" /> Test
                        </Link>
                        <Link
                          href={`/connectors/${connector.id}/docs`}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="API Documentation"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/connectors/${connector.id}/stats`}
                          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="Usage Statistics"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/connectors/${connector.id}`}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/connectors/${connector.id}/edit`}
                          className="p-2 text-slate-600 hover:text-amber-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                          title="Edit Connector"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggle(connector.id, connector.enabled)}
                          className={`p-2 border border-slate-200 rounded-lg transition ${
                            connector.enabled
                              ? 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={connector.enabled ? 'Disable Connector' : 'Enable Connector'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(connector.id, connector.name)}
                          className="p-2 text-slate-400 hover:text-red-600 border border-slate-200 hover:bg-red-50 rounded-lg transition"
                          title="Delete Connector"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
