import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { Card, Button } from '@/components/ui-base';

interface ProductCardProps {
    product: {
        _id: string;
        name: string;
        price: number;
        category: string;
        imageUrl: string;
        lastUpdated: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Card className="group flex flex-col h-full hover:shadow-glow transition-all duration-500 hover:-translate-y-2">
            <div className="relative h-64 w-full overflow-hidden">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-sm">
                    {product.category}
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-auto">
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors duration-300 antialiased">
                        {product.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                            ₦{product.price.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                            BEST PRICE
                        </span>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Updated {formatRelativeTime(product.lastUpdated)}</span>
                        <span className="flex items-center gap-1 text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Tracking
                        </span>
                    </div>

                    <Link
                        href={`/product/${product._id}`}
                        className="block"
                    >
                        <Button variant="glass" className="w-full py-3 text-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            Analyze & Discuss
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
