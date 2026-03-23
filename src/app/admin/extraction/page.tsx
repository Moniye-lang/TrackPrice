'use client';

import { useState } from 'react';

export default function ExtractionPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleExtract = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        setSuccessMsg('');
        setResults([]);

        try {
            const res = await fetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to extract.');

            // Initialize local status
            const initialResults = data.data.map((item: any) => ({
                ...item,
                status: 'pending' // pending locally before submission
            }));
            setResults(initialResults);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateResult = (index: number, field: string, value: any) => {
        const newResults = [...results];
        newResults[index][field] = value;
        setResults(newResults);
    };

    const setAllStatus = (status: 'approved' | 'rejected') => {
        setResults(results.map(r => ({ ...r, status })));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/scrape/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: results, sourceUrl: url })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit.');

            setSuccessMsg(data.message);
            setResults([]); // clear on success
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Dynamic Product Extraction</h1>
            <p className="text-gray-600 mb-6">Paste a store URL below to automatically extract products and prices using structural analysis (no APIs required).</p>

            <div className="flex gap-4 mb-6">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/store/..."
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                    disabled={loading}
                />
                <button
                    onClick={handleExtract}
                    disabled={loading || !url}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Extracting...' : 'Extract Products'}
                </button>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6 border border-red-200">{error}</div>}
            {successMsg && <div className="p-4 bg-green-50 text-green-600 rounded-lg mb-6 border border-green-200">{successMsg}</div>}

            {results.length > 0 && (
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                        <h2 className="font-semibold text-gray-800">Extracted Results ({results.length})</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setAllStatus('approved')} className="text-sm px-4 py-2 bg-green-100 text-green-700 font-medium rounded hover:bg-green-200 border border-green-200">Approve All</button>
                            <button onClick={() => setAllStatus('rejected')} className="text-sm px-4 py-2 bg-red-100 text-red-700 font-medium rounded hover:bg-red-200 border border-red-200">Reject All</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-sm sticky top-0 border-b">
                                <tr>
                                    <th className="p-3">Extracted Name</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Matched DB Product</th>
                                    <th className="p-3">Status Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {results.map((item, i) => (
                                    <tr key={i} className={`hover:bg-gray-50 transition-colors ${item.status === 'rejected' ? 'bg-gray-100 opacity-60' : ''}`}>
                                        <td className="p-3">
                                            <input
                                                value={item.name}
                                                onChange={e => handleUpdateResult(i, 'name', e.target.value)}
                                                className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">₦</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={e => handleUpdateResult(i, 'price', Number(e.target.value))}
                                                    className="w-24 p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none text-gray-800 font-medium"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {item.matchedProductId ? (
                                                <div className="flex flex-col">
                                                    <span className="text-green-700 font-semibold flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        {item.matchedProductName}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-5">Confidence Score: {(1 - item.matchScore).toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">
                                                    Unmatched (Queued)
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={item.status}
                                                onChange={e => handleUpdateResult(i, 'status', e.target.value)}
                                                className={`p-2 border rounded outline-none w-32 font-medium ${item.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        item.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-white text-gray-700'
                                                    }`}
                                            >
                                                <option value="pending">Reviewing</option>
                                                <option value="approved">Approve</option>
                                                <option value="rejected">Reject</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || results.every(r => r.status === 'rejected')}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Submit Validated Results'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
