'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, RefreshCw, CheckCircle2, AlertTriangle, Clock, DollarSign, Cpu } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TestConnectorPage({ params }: PageProps) {
  const { id } = use(params);

  const [connector, setConnector] = useState<any>(null);
  const [appApiKey, setAppApiKey] = useState<string>('');
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [fileInputs, setFileInputs] = useState<Record<string, { name: string; mimeType: string; data: string }>>({});
  
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [rawHttpStatus, setRawHttpStatus] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadConnectorData() {
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

          const initial: Record<string, any> = {};
          if (connData.data.inputs) {
            connData.data.inputs.forEach((p: any) => {
              initial[p.name] = p.defaultValue || '';
            });
          }
          setInputValues(initial);
        } else {
          setErrorMsg(connData.error?.message || 'Connector not found');
        }

        if (keyData.success) {
          setAppApiKey(keyData.apiKey);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading connector for testing');
      } finally {
        setLoading(false);
      }
    }
    loadConnectorData();
  }, [id]);

  const handleInputChange = (name: string, value: any) => {
    setInputValues({ ...inputValues, [name]: value });
  };

  const handleFileUpload = (name: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setFileInputs({
        ...fileInputs,
        [name]: {
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        },
      });
      setInputValues({
        ...inputValues,
        [name]: {
          name: file.name,
          mimeType: file.type,
          data: base64Data,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRunTest = async () => {
    if (!connector) return;
    setTesting(true);
    setTestResult(null);
    setRawHttpStatus(null);

    const endpointUrl = `/api/connectors/${connector.slug}`;

    try {
      const startTime = performance.now();
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': appApiKey,
        },
        body: JSON.stringify(inputValues),
      });
      const endTime = performance.now();

      const data = await res.json();
      setRawHttpStatus(res.status);
      setTestResult({
        ...data,
        clientDurationMs: Math.round(endTime - startTime),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          message: err.message || 'Failed to make fetch request to API endpoint.',
        },
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-base text-slate-600 font-medium">Loading interactive test suite...</p>
      </div>
    );
  }

  if (errorMsg || !connector) {
    return (
      <div className="space-y-4 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="p-5 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">{errorMsg || 'Connector not found'}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href={`/connectors/${connector.id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Connector Details
          </Link>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Play className="w-7 h-7 text-blue-600 fill-blue-600" />
            Test API Endpoint: {connector.name}
          </h1>
          <p className="text-xs font-mono text-slate-500 font-semibold mt-1">/api/connectors/{connector.slug}</p>
        </div>

        <button
          onClick={handleRunTest}
          disabled={testing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50 text-sm"
        >
          {testing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
          {testing ? 'Executing AI Request...' : 'Send Test Request'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Left Column: Input Form Payload */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Request Payload Inputs
            </h2>

            {!connector.inputs || connector.inputs.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                This connector has no input parameters configured. Clicking &quot;Send Test Request&quot; will invoke the AI model with empty parameters.
              </div>
            ) : (
              <div className="space-y-4">
                {connector.inputs.map((param: any) => (
                  <div key={param.id} className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>
                        {param.name} {param.required && <span className="text-red-500">*</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{param.type}</span>
                    </label>

                    {param.type === 'Text' && (
                      <input
                        type="text"
                        value={inputValues[param.name] || ''}
                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                        placeholder={param.description || `Enter ${param.name}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {param.type === 'Number' && (
                      <input
                        type="number"
                        value={inputValues[param.name] || ''}
                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                        placeholder={param.description || `Enter ${param.name}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    )}

                    {param.type === 'Boolean' && (
                      <select
                        value={String(inputValues[param.name])}
                        onChange={(e) => handleInputChange(param.name, e.target.value === 'true')}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    )}

                    {param.type === 'JSON' && (
                      <textarea
                        rows={3}
                        value={typeof inputValues[param.name] === 'object' ? JSON.stringify(inputValues[param.name], null, 2) : inputValues[param.name] || ''}
                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                        placeholder="Valid JSON object"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    )}

                    {(param.type === 'Image' || param.type === 'File') && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(param.name, e.target.files[0]);
                          }}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {fileInputs[param.name] && (
                          <div className="text-xs text-green-600 font-mono font-semibold">
                            Attached: {fileInputs[param.name].name} ({fileInputs[param.name].mimeType})
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Request Preview</h3>
            <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-green-400 overflow-x-auto">
              {JSON.stringify(inputValues, null, 2)}
            </pre>
          </div>
        </div>

        {/* Right Column: Execution Results */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Response Output
              </h2>
              {rawHttpStatus && (
                <span
                  className={`px-3 py-1 text-xs font-mono font-extrabold rounded-md ${
                    rawHttpStatus >= 200 && rawHttpStatus < 300
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  HTTP {rawHttpStatus}
                </span>
              )}
            </div>

            {testing ? (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Communicating with {connector.provider.toUpperCase()} ({connector.model})...
                </p>
              </div>
            ) : !testResult ? (
              <div className="text-center py-16 text-xs font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                Click &quot;Send Test Request&quot; above to execute the API call and view output metrics.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Metrics Banner */}
                {testResult.metrics && (
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1 uppercase">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Latency
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm mt-0.5">{testResult.metrics.responseTimeMs} ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1 uppercase">
                        <Cpu className="w-3.5 h-3.5 text-purple-600" /> Tokens
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm mt-0.5">{testResult.metrics.totalTokens ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1 uppercase">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Cost
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                        {testResult.metrics.estimatedCost ? `$${testResult.metrics.estimatedCost.toFixed(6)}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                {testResult.success ? (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-900 rounded-xl text-xs flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    Successfully generated &amp; validated structured response.
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-start gap-2.5 font-bold">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold">{testResult.error?.type || 'ERROR'}</div>
                      <div className="font-normal text-red-700">{testResult.error?.message || 'Request failed'}</div>
                    </div>
                  </div>
                )}

                {/* Response JSON Display */}
                <div>
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    JSON Response Body
                  </h3>
                  <pre className="p-4 bg-slate-900 text-green-400 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
