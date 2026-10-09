'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export interface ParameterInputItem {
  id?: string;
  name: string;
  type: 'Text' | 'Number' | 'Boolean' | 'Image' | 'File' | 'JSON';
  required: boolean;
  description: string;
  defaultValue: string;
  validation?: string;
}

interface ConnectorFormProps {
  initialValues?: {
    id?: string;
    name: string;
    description: string;
    provider: 'gemini' | 'openai';
    model: string;
    systemPrompt: string;
    outputSchema: string;
    enabled: boolean;
    inputs: ParameterInputItem[];
  };
  isEditing?: boolean;
}

export default function ConnectorForm({ initialValues, isEditing = false }: ConnectorFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [provider, setProvider] = useState<'gemini' | 'openai'>(initialValues?.provider || 'gemini');
  const [model, setModel] = useState(initialValues?.model || 'gemini-1.5-flash');
  const [systemPrompt, setSystemPrompt] = useState(initialValues?.systemPrompt || '');
  const [outputSchema, setOutputSchema] = useState(
    initialValues?.outputSchema || JSON.stringify({ result: "string", summary: "string" }, null, 2)
  );
  const [enabled, setEnabled] = useState(initialValues?.enabled ?? true);
  const [inputs, setInputs] = useState<ParameterInputItem[]>(initialValues?.inputs || []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider);
    if (!isEditing) {
      if (newProvider === 'gemini') setModel('gemini-1.5-flash');
      if (newProvider === 'openai') setModel('gpt-4o-mini');
    }
  };

  const addParameter = () => {
    setInputs([
      ...inputs,
      {
        name: `param_${inputs.length + 1}`,
        type: 'Text',
        required: false,
        description: '',
        defaultValue: '',
      },
    ]);
  };

  const removeParameter = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: keyof ParameterInputItem, value: any) => {
    const updated = [...inputs];
    updated[index] = { ...updated[index], [field]: value };
    setInputs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const parsed = JSON.parse(outputSchema);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Output schema must be a valid JSON object');
      }
    } catch (err: any) {
      setErrorMsg(`Invalid JSON in Output Schema: ${err.message}`);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name,
      description,
      provider,
      model,
      systemPrompt,
      outputSchema,
      enabled,
      inputs,
    };

    try {
      const url = isEditing ? `/api/connectors/${initialValues?.id}` : '/api/connectors';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save connector');
      }

      router.push(`/connectors/${data.data.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Connector' : 'Create AI Connector'}
          </h1>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50 text-sm"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Connector' : 'Save Connector'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Basic Info Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          1. Basic Information
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Connector Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Article Writer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Purpose
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of what this AI connector does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="enabledToggle"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="enabledToggle" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Active / Enabled (Connector accepts incoming API calls)
            </label>
          </div>
        </div>
      </div>

      {/* AI Provider Config */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          2. AI Provider &amp; Prompt Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              AI Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as 'gemini' | 'openai')}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-semibold"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI / Groq</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Model Identifier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            System Instructions / Prompt
          </label>
          <textarea
            rows={4}
            placeholder="Define instructions for the AI behavior, persona, rules, and guidelines..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
          />
        </div>
      </div>

      {/* Dynamic Input Parameters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              3. Dynamic Input Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Define input fields expected in the API request payload.
            </p>
          </div>
          <button
            type="button"
            onClick={addParameter}
            className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition border border-slate-200"
          >
            <Plus className="w-4 h-4" /> Add Parameter
          </button>
        </div>

        {inputs.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
            No input parameters configured. Click &quot;Add Parameter&quot; to define fields like topic, text, tone, etc.
          </div>
        ) : (
          <div className="space-y-4">
            {inputs.map((param, index) => (
              <div
                key={index}
                className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Parameter #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeParameter(index)}
                    className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. topic"
                      value={param.name}
                      onChange={(e) => updateParameter(index, 'name', e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Type
                    </label>
                    <select
                      value={param.type}
                      onChange={(e) => updateParameter(index, 'type', e.target.value as any)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none font-semibold"
                    >
                      <option value="Text">Text</option>
                      <option value="Number">Number</option>
                      <option value="Boolean">Boolean</option>
                      <option value="Image">Image</option>
                      <option value="File">File</option>
                      <option value="JSON">JSON</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Default Value
                    </label>
                    <input
                      type="text"
                      placeholder="Optional default"
                      value={param.defaultValue || ''}
                      onChange={(e) => updateParameter(index, 'defaultValue', e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      Required Parameter
                    </label>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Description (e.g. Topic of the article to generate)"
                    value={param.description || ''}
                    onChange={(e) => updateParameter(index, 'description', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expected Output JSON Schema */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm space-y-4 w-full">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          4. Expected Output JSON Structure <span className="text-red-500">*</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Enter a valid JSON object structure. The AI response will be enforced and parsed into this structure.
        </p>

        <textarea
          rows={6}
          required
          value={outputSchema}
          onChange={(e) => setOutputSchema(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Link
          href="/"
          className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition shadow-sm"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Connector' : 'Save Connector'}
        </button>
      </div>
    </form>
  );
}
