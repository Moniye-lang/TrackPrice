import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { FilterSection } from '@/components/FilterSection';
import { ClientBanners } from '@/components/ClientBanners';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';
import { TrendingUp, TrendingDown, Clock, Search, Award, Sparkles, ChevronRight, AlertCircle, Volume2, MapPin, Globe, X, Star, Plus, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Store from '@/models/Store';
import User from '@/models/User';
import Message from '@/models/Message';
import PriceUpdate from '@/models/PriceUpdate';
import { escapeRegex } from '@/lib/utils';

// Reusable data fetching logic (same as API but optimized for direct server use)
const getHomeData = unstable_cache(
    async () => {
        await connectDB();
        
        const [featured, stale, recent, leaderboard, stats, stores] = await Promise.all([
            // Featured
            Product.find({ isFeatured: true, status: 'approved' }).limit(4).populate('storeId').lean(),
            // Stale
            Product.find({
                $or: [
                    { category: 'Oil and Gas', lastUpdated: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
                    { category: { $ne: 'Oil and Gas' }, lastUpdated: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
                ]
            }).limit(5).lean(),
            // Recent updates
            Product.find({ status: 'approved' }).sort({ lastUpdated: -1 }).limit(5).lean(),
            // Leaderboard
            User.find({ role: 'user', isBanned: false }).sort({ points: -1 }).limit(3).select('name points reputationLevel').lean(),
            // Stats
            (async () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const updatesToday = await PriceUpdate.countDocuments({ status: 'verified', updatedAt: { $gt: today } });
                const marketsTracked = await Store.countDocuments({});
                const latestUpdate = await Product.findOne({ status: 'approved' }).sort({ lastUpdated: -1 }).select('lastUpdated');
                const lastUpdateMins = latestUpdate ? Math.floor((Date.now() - latestUpdate.lastUpdated.getTime()) / 60000) : 0;
                return { updatesToday, marketsTracked, lastUpdateMins };
            })(),
            // Stores
            Store.find().sort({ name: 1 }).lean()
        ]);

        return {
            featuredProducts: JSON.parse(JSON.stringify(featured)),
            staleProducts: JSON.parse(JSON.stringify(stale)),
            recentUpdates: JSON.parse(JSON.stringify(recent)),
            leaderboard: JSON.parse(JSON.stringify(leaderboard)),
            stats,
            stores: JSON.parse(JSON.stringify(stores))
        };
    },
    ['home-page-data'],
    { revalidate: 300, tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.STORES, CACHE_TAGS.STATS] }
);

async function getProducts(params: any) {
    await connectDB();
    const { search, category, marketCategory, storeId, city, sort, page = 1, limit = 12 } = params;
    
    const conditions: any[] = [];
    if (search) {
        const words = search.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
            const searchConditions = words.map((word: string) => ({
                name: { $regex: escapeRegex(word), $options: 'i' }
            }));
            conditions.push({ $and: searchConditions });
        }
    }
    if (category && category !== 'All') {
        conditions.push({ category });
    }
    // Market Channel Filtering: Default to Physical if not specified
    const activeMarketCat = marketCategory || 'Physical';
    
    if (activeMarketCat === 'Physical') {
        conditions.push({
            $or: [
                { marketCategory: 'Physical' },
                { marketCategory: { $exists: false } },
                { marketCategory: null }
            ]
        });
    } else if (activeMarketCat === 'Online') {
        conditions.push({ marketCategory: 'Online' });
    }
    
    if (storeId && storeId !== 'All') {
        conditions.push({ storeId });
    } else if (city && city !== 'All') {
        const cityRegex = new RegExp(`${escapeRegex(city)}$`, 'i');
        const storesInCity = await Store.find({ city: cityRegex }).select('_id').lean();
        const storeIds = storesInCity.map((s: any) => s._id);

        // Match products linked via storeId OR via legacy storeLocation text field
        const cityOrConditions: any[] = [];
        if (storeIds.length > 0) {
            cityOrConditions.push({ storeId: { $in: storeIds } });
        }
        // Also catch products whose freetext storeLocation contains the city name
        cityOrConditions.push({ storeLocation: { $regex: escapeRegex(city), $options: 'i' } });

        conditions.push({ $or: cityOrConditions });
    }

    // Always filter by status: 'approved' for home page
    conditions.push({ status: 'approved' });

    const query = conditions.length > 0 ? { $and: conditions } : {};
    
    let sortOption: any = {};
    if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;
    else if (sort === 'updated') sortOption.lastUpdated = -1;
    else sortOption.createdAt = -1;

    const skip = (page - 1) * limit;
    const [products, totalCount] = await Promise.all([
        Product.find(query).populate('storeId').sort(sortOption).skip(skip).limit(limit).lean(),
        Product.countDocuments(query)
    ]);

    return {
        products: JSON.parse(JSON.stringify(products)),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
    };
}

export default async function Home({ searchParams }: { searchParams: Promise<any> }) {
    const params = await searchParams;
    const { search, category, marketCategory, storeId, city, sort, page } = params;

    const [homeData, productsData] = await Promise.all([
        getHomeData(),
        getProducts({
            search,
            category,
            marketCategory,
            storeId,
            city,
            sort,
            page: parseInt(page || '1', 10),
            limit: 12
        })
    ]);

    const { featuredProducts, staleProducts, recentUpdates, leaderboard, stats, stores } = homeData;
    const { products, totalPages } = productsData;
    const currentPage = parseInt(page || '1', 10);

    const categories = ['All', 'Groceries', 'Oil and Gas', 'Beverages', 'Home', 'Electronics', 'Clothing', 'Health & Beauty', 'Books', 'Building Materials'];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "TrackPricely",
        "url": "https://trackpricely.com",
        "description": "Live price tracking for markets in Ibadan. Check prices before you buy anything.",
    };

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-12 md:py-24 px-4 overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-black mb-6 animate-fade-in uppercase tracking-[0.2em]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live Market Insights
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-slate-900 dark:text-white leading-[1] antialiased">
                        Check prices before you <span className="text-primary italic">buy anything</span> in Ibadan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg md:text-xl font-medium max-w-2xl mx-auto px-4">
                        Prices change daily — check before you buy today. Join people tracking live prices in Bodija, Dugbe, and beyond.
                    </p>

                    {/* Proof Bar */}
                    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-10">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20 shadow-sm transition-all hover:scale-105">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tighter">
                                {stats.updatesToday} Prices Updated Today
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100/50 dark:border-blue-500/20 shadow-sm transition-all hover:scale-105">
                            <MapPin size={16} className="text-blue-500" />
                            <span className="text-sm font-black text-blue-800 dark:text-blue-400 uppercase tracking-tighter">
                                {stats.marketsTracked} Markets Tracked
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100/50 dark:border-amber-500/20 shadow-sm transition-all hover:scale-105">
                            <Clock size={16} className="text-amber-500" />
                            <span className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-tighter">
                                Last Update: {stats.lastUpdateMins}m ago
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center mb-10">
                        <Link href="/stale-prices" className="group/cta flex items-center gap-4 bg-slate-900 border border-slate-800 px-8 py-4 rounded-3xl hover:bg-primary transition-all duration-500 shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 scale-100">
                            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow group-hover/cta:bg-white group-hover/cta:text-primary transition-all">
                                <TrendingUp size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-primary uppercase tracking-[0.3em] group-hover/cta:text-white transition-colors">Seen a different price?</p>
                                <p className="text-sm font-black text-white uppercase tracking-widest leading-none mt-1">UPDATE IT NOW</p>
                            </div>
                            <ChevronRight size={20} className="text-slate-600 group-hover/cta:text-white group-hover/cta:translate-x-1 transition-all" />
                        </Link>
                    </div>

                    {/* Interactive Filter Section */}
                    <FilterSection stores={stores} categories={categories} />
                </div>

                {/* Background elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
                </div>
            </section>

            <ClientBanners />

            {/* Featured Section */}
            {featuredProducts.length > 0 && !search && (category === 'All' || !category) && (
                <section className="max-w-7xl mx-auto px-4 py-12 min-h-[500px]">
                    <div className="flex justify-between items-end mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verified Hot Deals</h2>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Direct from community Consensus</p>
                            </div>
                        </div>
                        <div className="h-px bg-slate-100 flex-1 mx-8 mb-2 hidden md:block"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredProducts.map((p: any, index: number) => (
                            <ProductCard 
                                key={p._id} 
                                product={p} 
                                priority={index < 4} 
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12 pb-32 min-h-[1000px]">
                <div className="lg:col-span-3">
                    {!products || products.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
                            <div className="bg-white dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-premium">
                                <Search size={40} className="text-slate-200 dark:text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 dark:text-slate-200 mb-2">No products found</h3>
                            <p className="text-slate-400 font-medium mb-8 max-w-sm">We couldn't find any products matching your search criteria. Try a different term or add it yourself!</p>
                            <Link href="/add-product">
                                <Button className="px-10 py-4 font-black text-xs tracking-[0.2em] uppercase shadow-glow rounded-2xl flex items-center gap-2">
                                    <Plus size={16} />
                                    Add Missing Product
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products?.map((product: any, index: number) => (
                                    <ProductCard key={product._id} product={product} priority={index < 3} />
                                ))}
                            </div>
                            
                            <Pagination currentPage={currentPage} totalPages={totalPages} />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-12 lg:sticky lg:top-28 h-fit">
                    {/* Stale Prices / Needs Update */}
                    {staleProducts.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                     <AlertCircle size={14} className="text-rose-500" />
                                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                                        Needs Update
                                     </h3>
                                </div>
                                <Link href="/stale-prices" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {staleProducts.map((p: any) => (
                                    <Link key={p._id} href={`/product/${p._id}`} className="flex items-center gap-4 group">
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 relative flex items-center justify-center font-bold text-slate-300">
                                            {p.imageUrl ? (
                                                <Image 
                                                    src={p.imageUrl} 
                                                    alt={p.name} 
                                                    fill 
                                                    sizes="48px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <span>📦</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{p.name}</h4>
                                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                <Clock size={10} />
                                                Stale Price
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recently Updated */}
                    {recentUpdates.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Volume2 size={14} className="text-primary" />
                                Live Price Feed
                            </h3>
                            <div className="space-y-5">
                                {recentUpdates.map((p: any) => {
                                    const priceStatus = p.priceHistory && p.priceHistory.length >= 2 
                                        ? (p.price < p.priceHistory[p.priceHistory.length-2].price ? 'down' : 'up')
                                        : 'up';
                                    
                                    return (
                                        <Link key={p._id} href={`/product/${p._id}`} className="flex items-start gap-4 group">
                                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${priceStatus === 'down' ? 'bg-rose-500' : 'bg-emerald-500 opacity-50'}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-700 text-sm truncate group-hover:text-primary transition-colors">{p.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-1 ${priceStatus === 'down' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {priceStatus === 'down' ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                                                        {priceStatus === 'down' ? 'Price Drop' : 'Updated'}
                                                    </p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span className="font-black text-slate-900 text-xs">{formatPriceRange(p.price)}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors self-center" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Snippet */}
                    {leaderboard.length > 0 && (
                        <div className="p-6 bg-slate-900 rounded-[32px] shadow-premium border border-slate-800 relative overflow-hidden group/card">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full group-hover/card:bg-primary/30 transition-colors" />
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                                <Award size={14} />
                                Top Market Analysts
                            </h3>
                            <div className="space-y-6 relative z-10">
                                {leaderboard.map((user: any, i: number) => (
                                    <div key={user._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg ${i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950' :
                                                i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900' :
                                                    'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white antialiased">{user.name}</p>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">{user.reputationLevel}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-primary">{user.points}</p>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase">PTS</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/leaderboard" className="block text-center mt-8 pt-6 border-t border-slate-800 text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]">
                                View Full Rankings
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
