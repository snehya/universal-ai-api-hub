'use client';

import { useEffect, useState, use } from 'react';
import ConnectorForm from '@/components/ConnectorForm';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditConnectorPage({ params }: PageProps) {
  const { id } = use(params);

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConnector() {
      try {
        const res = await fetch(`/api/connectors/${id}`);
        const data = await res.json();
        if (data.success) {
          setInitialData(data.data);
        } else {
          setError(data.error?.message || 'Failed to load connector details');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching connector details');
      } finally {
        setLoading(false);
      }
    }
    loadConnector();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading connector data for editing...</p>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="space-y-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          {error || 'Connector not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ConnectorForm initialValues={initialData} isEditing={true} />
    </div>
  );
}
