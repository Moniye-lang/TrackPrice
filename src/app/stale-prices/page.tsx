'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { AlertCircle, Clock, Search, TrendingUp, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function StalePricesPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaleProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/products?stale=true');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error('Failed to fetch stale products');
            } finally {
                setLoading(false);
            }
        };
        fetchStaleProducts();
    }, []);

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Home</span>
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-black mb-4 uppercase tracking-widest">
                                <Clock size={14} />
                                Needs Price Updates
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                                Community <span className="text-primary italic">Action Center</span>
                            </h1>
                            <p className="text-slate-500 mt-4 text-lg font-medium max-w-2xl">
                                These products haven't had a price update recently. Help the community by providing the latest prices from your local market.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50 border border-amber-100/50 p-6 rounded-[32px] mb-12 flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-glow-sm">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-amber-900 uppercase tracking-tightest mb-1">How it works</h3>
                        <p className="text-amber-800/80 text-sm font-medium">
                            Prices in Ibadan change fast. Oil and Gas prices are tracked every 2 days, while others are tracked weekly. 
                            Click on a product to suggest a new price and earn reputation points!
                        </p>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-[400px] glass rounded-3xl relative overflow-hidden bg-white/20">
                                <div className="absolute inset-0 animate-shimmer" />
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center">
                        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-premium">
                            <TrendingUp size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 mb-2">Wow! Everything is up to date!</h3>
                        <p className="text-slate-400 font-medium mb-8 max-w-sm">
                            The community has been busy. No products currently need urgent updates.
                        </p>
                        <Link href="/">
                            <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-glow hover:scale-105 transition-all">
                                Explore All Products
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
