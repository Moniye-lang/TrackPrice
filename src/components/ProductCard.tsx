import { useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { Card } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';
import { MapPin, Users, MessageCircle, CheckCircle, AlertTriangle, TrendingDown, TrendingUp, Sparkles, Clock, ChevronRight, ImageOff } from 'lucide-react';

interface ProductCardProps {
    product: {
        _id: string;
        name: string;
        brand?: string;
        variant?: string;
        size?: string;
        price: number;
        maxPrice?: number;
        category: string;
        imageUrl: string;
        storeId?: {
            _id: string;
            name: string;
            area: string;
            city: string;
        };
        storeLocation?: string;
        lastUpdated: string;
        confidenceLevel?: 'Low' | 'Medium' | 'High';
        reportCount?: number;
        messageCount?: number;
        flagged?: boolean;
        isFeatured?: boolean;
        pendingUpdate?: {
            _id: string;
            price: number;
            maxPrice?: number;
            confirmationsCount: number;
        } | null;
        priceStatus?: 'up' | 'down' | 'stable';
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const [imgError, setImgError] = useState(false);
    const hasImage = product.imageUrl && !imgError && !product.imageUrl.includes('placehold.co');

    return (
        <Link href={`/product/${product._id}`} className="block group">
            <Card className="flex flex-col h-full hover:shadow-glow transition-all duration-500 hover:-translate-y-2 cursor-pointer border-slate-100 overflow-hidden">
                <div className="relative h-64 w-full overflow-hidden bg-slate-50">
                    {hasImage ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            onError={() => setImgError(true)}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
                            <div className="w-16 h-16 rounded-3xl bg-white shadow-premium flex items-center justify-center text-slate-200 group-hover:text-primary/40 group-hover:scale-110 transition-all duration-500">
                                <ImageOff size={32} strokeWidth={1.5} />
                            </div>
                            <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Image Available</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-lg border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                        <Sparkles size={10} className="text-accent" />
                        {product.category}
                    </div>

                    {/* Premium Price Badge on Image (Visible on Hover) */}
                    <div className="absolute bottom-4 left-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        <div className="glass px-4 py-2 rounded-2xl shadow-2xl border border-white/30 backdrop-blur-xl">
                            <p className="text-[10px] font-black text-primary/80 uppercase tracking-tighter mb-0.5">Live Price</p>
                            <p className="text-xl font-black text-white tracking-tighter leading-none">
                                {formatPriceRange(product.price, product.maxPrice)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Proposed Price Alert */}
                {product.pendingUpdate && (
                    <div className="mx-4 mt-4 p-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between group/alert hover:bg-primary/10 transition-all">
                        <div className="min-w-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <AlertTriangle size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Proposed Price</p>
                                <p className="text-sm font-black text-slate-800 tracking-tighter truncate">
                                    ₦{product.pendingUpdate.price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/product/${product._id}?confirm=${product.pendingUpdate?._id}`;
                            }}
                            className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-premium hover:scale-105 active:scale-95 transition-all"
                        >
                            Confirm
                        </button>
                    </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-auto">
                        <div className="flex justify-between items-start gap-2 mb-3">
                            <h3 className="text-xl font-black text-slate-800 line-clamp-2 group-hover:text-primary transition-colors duration-300 antialiased leading-[1.1]">
                                {product.brand && <span className="text-primary/70">{product.brand} </span>}
                                {product.name}
                            </h3>
                            <div className="flex-shrink-0">
                                {product.flagged ? (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 uppercase tracking-tighter">
                                        <AlertTriangle size={10} />
                                        Flagged
                                    </span>
                                ) : product.confidenceLevel === 'High' ? (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-tighter">
                                        <CheckCircle size={10} />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-tighter">
                                        <Clock size={10} />
                                        Estimate
                                    </span>
                                )}
                            </div>
                        </div>

                        {(product.variant || product.size) && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {product.variant} {product.size && `| ${product.size}`}
                            </p>
                        )}

                        {(product.storeId || product.storeLocation) && (
                            <p className="text-[13px] font-bold text-slate-600 flex items-center gap-2 mb-4">
                                <MapPin size={14} className="text-primary/60" />
                                <span className="truncate">
                                    {product.storeId ? `${product.storeId.name} (${product.storeId.area})` : product.storeLocation}
                                </span>
                            </p>
                        )}

                        <div className="flex items-center gap-3 mt-4">
                            <span className={`text-3xl font-black tracking-tightest group-hover:text-primary transition-colors ${product.priceStatus === 'down' ? 'text-rose-600' :
                                    product.priceStatus === 'up' ? 'text-emerald-600' :
                                        'text-slate-900'
                                }`}>
                                {formatPriceRange(product.price, product.maxPrice)}
                            </span>
                            <div className="flex flex-col">
                                {product.priceStatus === 'down' && (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-tighter animate-bounce-subtle">
                                        <TrendingDown size={12} />
                                        Price Drop
                                    </div>
                                )}
                                {product.priceStatus === 'up' && (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                                        <TrendingUp size={12} />
                                        Increased
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Trust Indicators Bar */}
                    <div className="mt-5 flex items-center justify-between p-3 bg-slate-50 border border-slate-100/80 rounded-2xl group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors duration-500">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
                                        product.confidenceLevel === 'High' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                        product.confidenceLevel === 'Medium' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-rose-500 shadow-rose-500/50'
                                    }`} />
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${
                                        product.confidenceLevel === 'High' ? 'text-emerald-700' :
                                        product.confidenceLevel === 'Medium' ? 'text-amber-700' : 'text-rose-700'
                                    }`}>
                                        {product.confidenceLevel === 'High' ? 'Verified' : product.confidenceLevel || 'Low'}
                                    </span>
                                </div>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Signals</span>
                                <div className="flex items-center gap-1.5 text-slate-700">
                                    <Users size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">
                                        {product.reportCount || 0} <span className="text-slate-400 font-bold ml-0.5">Confirmations</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        {(product.messageCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl shadow-premium-sm border border-slate-50">
                                <MessageCircle size={12} className="text-primary" />
                                <span className="text-[10px] font-black text-slate-700">{product.messageCount}</span>
                            </div>
                        )}
                    </div>

                    {/* Primary CTA Button */}
                    <div className="mt-5 pt-5 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {formatRelativeTime(product.lastUpdated)}
                            </span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/product/${product._id}?update=true`;
                            }}
                            className="bg-primary hover:bg-primary-dark group/btn px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-glow flex items-center gap-2 transition-all active:scale-95"
                        >
                            Update Price
                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
