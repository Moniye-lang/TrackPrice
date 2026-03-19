import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { Card } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';

interface ProductCardProps {
    product: {
        _id: string;
        name: string;
        price: number;
        maxPrice?: number;
        category: string;
        imageUrl: string;
        lastUpdated: string;
        confidenceLevel?: 'Low' | 'Medium' | 'High';
        reportCount?: number;
        messageCount?: number;
        flagged?: boolean;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/product/${product._id}`} className="block group">
            <Card className="flex flex-col h-full hover:shadow-glow transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                <div className="relative h-64 w-full overflow-hidden">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-lg border border-white/20 backdrop-blur-md">
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

                <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-auto">
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <h3 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors duration-300 antialiased">
                                {product.name}
                            </h3>
                            <div className="flex-shrink-0">
                                {product.flagged ? (
                                    <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 uppercase tracking-tighter">
                                        Flagged
                                    </span>
                                ) : product.confidenceLevel === 'High' ? (
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-tighter">
                                        Verified
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-tighter">
                                        Estimate
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tightest group-hover:text-primary transition-colors">
                                {formatPriceRange(product.price, product.maxPrice)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${product.confidenceLevel === 'High' ? 'bg-emerald-500' :
                                product.confidenceLevel === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                            {product.confidenceLevel || 'Low'} Confidence
                        </div>
                        <div className="flex items-center gap-1">
                            👥 {product.reportCount || 0} Reports
                        </div>
                        {(product.messageCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                                💬 {product.messageCount} {product.messageCount === 1 ? 'message' : 'messages'}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Updated {formatRelativeTime(product.lastUpdated)}</span>
                        <span className="flex items-center gap-1.5 text-primary group-hover:gap-2.5 transition-all">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            View Details
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
