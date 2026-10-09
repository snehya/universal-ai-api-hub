'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Key, Copy, Check, ShieldCheck, ArrowLeft, RefreshCw, Code2, AlertTriangle } from 'lucide-react';

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) {
        setApiKey(data.apiKey);
      } else {
        setError(data.error?.message || 'Failed to fetch API key');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Key className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Application API Keys</h1>
          </div>
          <p className="text-base text-slate-600 mt-1">
            Manage and inspect authentication credentials required for AI API Hub connector endpoints.
          </p>
        </div>

        <button
          onClick={fetchKeys}
          className="p-2.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-sm self-start sm:self-auto"
          title="Refresh Keys"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-base text-slate-600 font-medium">Retrieving API key credentials...</p>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {/* Main Key Display Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" /> Primary Gateway API Key
              </h2>
              <span className="px-3 py-1 text-xs font-extrabold bg-green-100 text-green-800 border border-green-200 rounded-full">
                ACTIVE
              </span>
            </div>

            <p className="text-sm text-slate-600">
              Pass this key in the <code className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-blue-600 font-semibold">x-api-key</code> header of all incoming POST requests to your connector endpoints.
            </p>

            <div className="flex items-center gap-3 bg-slate-50 p-4 lg:p-5 rounded-xl border border-slate-200">
              <Key className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <code className="text-sm font-mono text-slate-900 font-bold flex-1 select-all break-all">
                {apiKey}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Key!' : 'Copy Key'}
              </button>
            </div>
          </div>

          {/* Integration Instructions Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Code2 className="w-6 h-6 text-blue-600" /> How to Authenticate Requests
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">HTTP Header Format</h3>
                <pre className="p-4 bg-slate-900 text-green-400 rounded-xl font-mono text-xs overflow-x-auto">
                  x-api-key: {apiKey}
                </pre>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">cURL Example</h3>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {`curl -X POST "http://localhost:3000/api/connectors/YOUR_SLUG" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"topic": "Artificial Intelligence"}'`}
                </pre>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Security Best Practices</span>
              Keep your Application API key confidential. Never expose secret keys in public code repositories, client-side browser bundles, or mobile app binaries.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
