'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit3, Trash2, Power, Copy, Check, Key, Code2, RefreshCw, Play, FileText, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConnectorDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [connector, setConnector] = useState<any>(null);
  const [appApiKey, setAppApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [connRes, keyRes] = await Promise.all([
          fetch(`/api/connectors/${id}`),
          fetch('/api/keys'),
        ]);

        const connData = await connRes.json();
        const keyData = await keyRes.json();

        if (connData.success) {
          setConnector(connData.data);
        } else {
          setError(connData.error?.message || 'Connector not found');
        }

        if (keyData.success) {
          setAppApiKey(keyData.apiKey);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading connector details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleToggle = async () => {
    if (!connector) return;
    try {
      const res = await fetch(`/api/connectors/${connector.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !connector.enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setConnector({ ...connector, enabled: data.data.enabled });
      }
    } catch (err) {
      console.error('Failed to toggle connector status:', err);
    }
  };

  const handleDelete = async () => {
    if (!connector) return;
    if (!confirm(`Are you sure you want to delete "${connector.name}"?`)) return;

    try {
      const res = await fetch(`/api/connectors/${connector.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        alert(data.error?.message || 'Failed to delete connector');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting connector');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-base text-slate-600 font-medium">Loading connector details...</p>
      </div>
    );
  }

  if (error || !connector) {
    return (
      <div className="space-y-4 w-full">
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="p-5 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">{error || 'Connector not found'}</div>
      </div>
    );
  }

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fullEndpointUrl = `${hostUrl}/api/connectors/${connector.slug}`;

  return (
    <div className="w-full space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{connector.name}</h1>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                connector.enabled
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {connector.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          {connector.description && <p className="text-base text-slate-600 mt-1">{connector.description}</p>}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/connectors/${connector.id}/test`}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow transition"
          >
            <Play className="w-4 h-4 fill-white" /> Test API
          </Link>
          <Link
            href={`/connectors/${connector.id}/docs`}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <FileText className="w-4 h-4" /> Documentation
          </Link>
          <Link
            href={`/connectors/${connector.id}/stats`}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <BarChart2 className="w-4 h-4" /> Statistics
          </Link>
          <Link
            href={`/connectors/${connector.id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={handleToggle}
            className="p-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition shadow-sm"
            title={connector.enabled ? 'Disable Connector' : 'Enable Connector'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition shadow-sm"
            title="Delete Connector"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Endpoint & Credentials Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-blue-600" /> API Integration Details
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
              POST API Endpoint URL
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <code className="text-xs font-mono font-bold text-blue-600 truncate flex-1">{fullEndpointUrl}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullEndpointUrl);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="p-1.5 text-slate-500 hover:text-slate-800"
                title="Copy Endpoint URL"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
              Application API Key (`x-api-key`)
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Key className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <code className="text-xs font-mono font-bold text-slate-900 truncate flex-1">{appApiKey || 'Loading...'}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(appApiKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="p-1.5 text-slate-500 hover:text-slate-800"
                title="Copy API Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details & Input Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">AI Configuration</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Provider:</span>
              <span className="font-bold text-slate-900 uppercase">{connector.provider}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Model:</span>
              <span className="font-mono font-bold text-slate-900">{connector.model}</span>
            </div>
            {connector.systemPrompt && (
              <div className="pt-2">
                <span className="text-slate-500 font-medium block mb-1">System Prompt:</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                  {connector.systemPrompt}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Configured Inputs ({connector.inputs?.length || 0})</h3>
          <div className="space-y-2.5">
            {!connector.inputs || connector.inputs.length === 0 ? (
              <p className="text-xs text-slate-400">No dynamic parameters defined.</p>
            ) : (
              connector.inputs.map((param: any) => (
                <div key={param.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">{param.name}</span>
                    <span className="ml-2 text-[11px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                      {param.type}
                    </span>
                    {param.description && <p className="text-xs text-slate-500 mt-0.5">{param.description}</p>}
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${param.required ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-200 text-slate-700'}`}>
                    {param.required ? 'REQUIRED' : 'OPTIONAL'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
