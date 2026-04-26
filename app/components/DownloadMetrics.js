'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Download } from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
);

export default function DownloadMetrics({ compact = false }) {
    const [downloadCount, setDownloadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const { data, error } = await supabase
                    .from('app_metrics')
                    .select('apk_downloads')
                    .eq('id', 'global_stats')
                    .single();

                if (error) throw error;
                if (data) setDownloadCount(data.apk_downloads);
            } catch (error) {
                console.error("Failed to load metrics", error);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    // --- COMPACT HEADER PILL ---
    if (compact) {
        return (
            <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm" 
                title="Total App Downloads"
            >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {loading ? (
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
                ) : (
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 pr-1">
                        {downloadCount.toLocaleString()}
                    </span>
                )}
            </div>
        );
    }

    // --- ORIGINAL BIG DASHBOARD CARD ---
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center h-full dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                Total APK Downloads
            </h3>
            {loading ? (
                <div className="animate-pulse h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ) : (
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                    {downloadCount.toLocaleString()}
                </div>
            )}
        </div>
    );
}