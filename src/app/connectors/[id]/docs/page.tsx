'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, FileText, Lock, Code2, Server, AlertTriangle, Play, RefreshCw, BarChart2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConnectorDocsPage({ params }: PageProps) {
  const { id } = use(params);

  const [connector, setConnector] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/connectors/${id}`);
        const data = await res.json();
        if (data.success) {
          setConnector(data.data);
        } else {
          setError(data.error?.message || 'Connector not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading connector details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-base text-slate-600 font-medium">Generating API documentation...</p>
      </div>
    );
  }

  if (error || !connector) {
    return (
      <div className="space-y-4 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="p-5 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">{error || 'Connector not found'}</div>
      </div>
    );
  }

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://YOUR-DOMAIN';
  const endpointUrl = `${hostUrl}/api/connectors/${connector.slug}`;

  const sampleRequestObj: Record<string, any> = {};
  if (connector.inputs && Array.isArray(connector.inputs)) {
    connector.inputs.forEach((input: any) => {
      if (input.type === 'Number') {
        sampleRequestObj[input.name] = input.defaultValue ? Number(input.defaultValue) : 5;
      } else if (input.type === 'Boolean') {
        sampleRequestObj[input.name] = input.defaultValue ? input.defaultValue === 'true' : true;
      } else if (input.type === 'Select') {
        let opts = [];
        try {
          opts = input.validation ? JSON.parse(input.validation) : [];
        } catch {
          opts = [];
        }
        sampleRequestObj[input.name] = opts.length > 0 ? opts[0] : input.defaultValue || 'option_1';
      } else if (input.type === 'File') {
        sampleRequestObj[input.name] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      } else {
        if (input.name.toLowerCase().includes('topic')) {
          sampleRequestObj[input.name] = 'Artificial Intelligence in modern web development';
        } else if (input.name.toLowerCase().includes('tone')) {
          sampleRequestObj[input.name] = 'informative and concise';
        } else if (input.name.toLowerCase().includes('text')) {
          sampleRequestObj[input.name] = 'AI API Hub transforms prompts into production REST endpoints.';
        } else {
          sampleRequestObj[input.name] = input.defaultValue || `Sample text for ${input.name}`;
        }
      }
    });
  }

  const sampleRequestBodyJson = JSON.stringify(sampleRequestObj, null, 2);

  const curlExample = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_APPLICATION_API_KEY" \\
  -d '${sampleRequestBodyJson}'`;

  let parsedOutputSchema: any = null;
  try {
    parsedOutputSchema = JSON.parse(connector.outputSchema);
  } catch {
    parsedOutputSchema = { result: "string" };
  }

  const sampleSuccessResponse = {
    success: true,
    data: parsedOutputSchema,
    metrics: {
      responseTimeMs: 342,
      inputTokens: 145,
      outputTokens: 88,
      totalTokens: 233,
      estimatedCost: 0.00018
    }
  };

  const sampleSuccessResponseJson = JSON.stringify(sampleSuccessResponse, null, 2);

  const sampleErrorResponseJson = JSON.stringify({
    success: false,
    error: {
      type: "INVALID_INPUT",
      message: "Missing required parameter: topic"
    }
  }, null, 2);

  const requiredInputs = (connector.inputs || []).filter((i: any) => i.required);
  const optionalInputs = (connector.inputs || []).filter((i: any) => !i.required);

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{connector.name} API Reference</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/connectors/${connector.id}/test`}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow transition"
          >
            <Play className="w-4 h-4 fill-white" /> Test API
          </Link>
          <Link
            href={`/connectors/${connector.id}/stats`}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <BarChart2 className="w-4 h-4" /> Statistics
          </Link>
        </div>
      </div>

      {/* SECTION 1: Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-6 h-6 text-blue-600" /> Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Connector Name</span>
            <span className="font-bold text-slate-900 text-base">{connector.name}</span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Description</span>
            <span className="text-slate-700 font-medium">{connector.description || 'No description provided.'}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Endpoint Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Code2 className="w-6 h-6 text-blue-600" /> Endpoint Information
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="px-3 py-1 text-xs font-black bg-blue-600 text-white rounded-md">POST</span>
              <code className="text-sm font-mono font-bold text-slate-900 truncate">{endpointUrl}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(endpointUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline flex-shrink-0"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copiedUrl ? 'Copied' : 'Copy Endpoint'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">HTTP Method</span>
              <span className="font-mono font-bold text-sm text-slate-900">POST</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Content-Type</span>
              <span className="font-mono font-bold text-sm text-slate-900">application/json</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Authentication Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-6 h-6 text-amber-500" /> Authentication
        </h2>
        <p className="text-sm text-slate-700">
          All HTTP requests to this endpoint require authentication via the custom HTTP header:
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900 flex items-center gap-2">
          <span className="font-bold">Header:</span>
          <code className="font-bold">x-api-key: YOUR_APPLICATION_API_KEY</code>
        </div>
      </div>

      {/* SECTION 4: Provider Information Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-6 h-6 text-purple-600" /> Provider Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1">AI Provider</span>
            <span className="font-bold text-slate-900 text-base uppercase">{connector.provider}</span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Model</span>
            <span className="font-mono font-bold text-slate-900 text-base">{connector.model}</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Request Parameters Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-6 w-full">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Request Parameters
        </h2>

        {/* Required Parameters */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Required Parameters ({requiredInputs.length})</h3>
          {requiredInputs.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No required parameters.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase">
                    <th className="py-3 px-4">Field Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requiredInputs.map((param: any) => (
                    <tr key={param.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-sm text-blue-600">{param.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{param.type}</td>
                      <td className="py-3 px-4 text-slate-700">{param.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Optional Parameters */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Optional Parameters ({optionalInputs.length})</h3>
          {optionalInputs.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No optional parameters.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase">
                    <th className="py-3 px-4">Field Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Default Value</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {optionalInputs.map((param: any) => (
                    <tr key={param.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-sm text-slate-900">{param.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{param.type}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{param.defaultValue || 'none'}</td>
                      <td className="py-3 px-4 text-slate-700">{param.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6: Request Example Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Example Request Body</h2>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sampleRequestBodyJson);
              setCopiedBody(true);
              setTimeout(() => setCopiedBody(false), 2000);
            }}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
          >
            {copiedBody ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copiedBody ? 'Copied' : 'Copy Request Body'}
          </button>
        </div>
        <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
          {sampleRequestBodyJson}
        </pre>
      </div>

      {/* SECTION 7: Example cURL Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Example cURL Request</h2>
          <button
            onClick={() => {
              navigator.clipboard.writeText(curlExample);
              setCopiedCurl(true);
              setTimeout(() => setCopiedCurl(false), 2000);
            }}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
          >
            {copiedCurl ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copiedCurl ? 'Copied' : 'Copy cURL'}
          </button>
        </div>
        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {curlExample}
        </pre>
      </div>

      {/* SECTION 8: Response Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900">Expected Successful Response (200 OK)</h2>
        <p className="text-xs text-slate-600 font-medium">
          The API returns a structured JSON payload containing <code className="font-mono text-slate-900 font-bold">success: true</code>, structured output data matching the connector schema, and request execution metrics.
        </p>
        <pre className="p-4 bg-slate-900 text-blue-300 rounded-xl text-xs font-mono overflow-x-auto">
          {sampleSuccessResponseJson}
        </pre>
      </div>

      {/* SECTION 9: Error Response Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" /> Error Responses &amp; Status Codes
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
            <span className="font-bold text-red-800 block">HTTP 400 Bad Request</span>
            <span className="text-slate-700">Returned when required parameters are missing or data types are invalid.</span>
          </div>
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
            <span className="font-bold text-red-800 block">HTTP 401 Unauthorized</span>
            <span className="text-slate-700">Returned when <code className="font-mono">x-api-key</code> is missing or invalid.</span>
          </div>
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
            <span className="font-bold text-red-800 block">HTTP 500 Internal Server Error</span>
            <span className="text-slate-700">Returned when upstream AI provider API execution fails.</span>
          </div>
        </div>
        <pre className="p-4 bg-slate-900 text-red-400 rounded-xl text-xs font-mono overflow-x-auto">
          {sampleErrorResponseJson}
        </pre>
      </div>
    </div>
  );
}
