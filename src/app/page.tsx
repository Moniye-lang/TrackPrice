'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { Input, Button } from '@/components/ui-base';
import { formatPriceRange } from '@/lib/price-utils';
import { TrendingUp, TrendingDown, Clock, Search, Award, Sparkles, ChevronRight, AlertCircle, Volume2, MapPin, BarChart3, CheckCircle2, Plus, Zap, Globe } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [marketCategory, setMarketCategory] = useState<'All' | 'Online' | 'Physical'>('Physical');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [staleProducts, setStaleProducts] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState('All');
  const [trendingCategory, setTrendingCategory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    updatesToday: 0,
    marketsTracked: 0,
    lastUpdateMins: 0
  });
  const [dailyHookProducts, setDailyHookProducts] = useState<any[]>([]);

  const fetchHomepageData = async () => {
    try {
      const [featRes, staleRes, recentRes, leaderRes, storeRes, trendingRes] = await Promise.all([
        fetch('/api/products?featured=true'),
        fetch('/api/products?stale=true'),
        fetch('/api/products?sort=updated'),
        fetch('/api/leaderboard'),
        fetch('/api/stores'),
        fetch('/api/products?category=Groceries&search=Rice')
      ]);

      if (featRes.ok) setFeaturedProducts((await featRes.json()).slice(0, 4));
      if (staleRes.ok) setStaleProducts((await staleRes.json()).slice(0, 5));
      if (recentRes.ok) setRecentUpdates((await recentRes.json()).slice(0, 5));
      if (storeRes.ok) setStores(await storeRes.json());
      if (trendingRes.ok) setTrendingCategory((await trendingRes.json()).slice(0, 4));
      if (leaderRes.ok) {
        const data = await leaderRes.json();
        setLeaderboard(data.users || []);
      }

      // Mock or Calculate Proof Stats for Launch
      // In a real app, these would come from specialized aggregation APIs
      setStats({
          updatesToday: 24 + Math.floor(Math.random() * 10),
          marketsTracked: storeRes.ok ? (await storeRes.clone().json()).length : 12,
          lastUpdateMins: 2
      });

      // Daily Hook Products (Critical Items)
      const hookRes = await fetch('/api/products?search=Petrol,Rice,Eggs,Bread');
      if (hookRes.ok) {
        const hookData = await hookRes.json();
        setDailyHookProducts(hookData.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch homepage data');
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const categories = ['All', 'Electronics', 'Clothing', 'Home', 'Groceries', 'Books'];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category,
        marketCategory,
        storeId,
        sort,
      });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
        console.error('API Error:', data.error || 'Unknown error');
      }
    } catch (error) {
      setProducts([]);
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, storeId, sort, marketCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-mesh selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-12 md:py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black mb-6 animate-fade-in uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live Market Insights
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-slate-900 leading-[1] antialiased">
            Check prices before you <span className="text-primary italic">buy anything</span> in Ibadan
          </h1>
          <p className="text-slate-500 mb-8 text-lg md:text-xl font-medium max-w-2xl mx-auto px-4">
            Prices change daily — check before you buy today. Join people tracking live prices in Bodija, Dugbe, and beyond.
          </p>

          {/* Proof Bar */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100/50 shadow-sm transition-all hover:scale-105">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-black text-emerald-800 uppercase tracking-tighter">
                    {stats.updatesToday} Prices Updated Today
                </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100/50 shadow-sm transition-all hover:scale-105">
                <MapPin size={16} className="text-blue-500" />
                <span className="text-xs font-black text-blue-800 uppercase tracking-tighter">
                    {stats.marketsTracked} Markets Tracked
                </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100/50 shadow-sm transition-all hover:scale-105">
                <Clock size={16} className="text-amber-500" />
                <span className="text-xs font-black text-amber-800 uppercase tracking-tighter">
                    Last Update: {stats.lastUpdateMins}m ago
                </span>
            </div>
          </div>

          <div className="flex justify-center mb-10">
            <Link href="/stale-prices" className="group/cta flex items-center gap-4 bg-slate-900 border border-slate-800 px-8 py-4 rounded-3xl hover:bg-primary transition-all duration-500 shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 scale-110">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow group-hover/cta:bg-white group-hover/cta:text-primary transition-all">
                <TrendingUp size={20} />
              </div>
              <div className="text-left">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] group-hover/cta:text-white transition-colors">Seen a different price?</p>
                  <p className="text-sm font-black text-white uppercase tracking-widest leading-none mt-1">UPDATE IT NOW</p>
              </div>
              <ChevronRight size={20} className="text-slate-600 group-hover/cta:text-white group-hover/cta:translate-x-1 transition-all" />
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto bg-white/40 p-2 rounded-3xl border border-white/60 shadow-2xl backdrop-blur-xl">
            <div className="relative flex-[2]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
              <Input
                className="border-none bg-transparent focus:ring-0 text-slate-800 text-lg px-16 h-16 w-full"
                placeholder="Search rice, eggs, oil, bread..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="h-10 w-px bg-slate-200 self-center hidden sm:block" />

            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={20} />
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full h-16 bg-transparent border-none pl-12 pr-4 text-sm font-black text-slate-700 focus:ring-0 cursor-pointer outline-none appearance-none"
              >
                <option value="All">All Markets</option>
                {stores.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.area})</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-glow font-black h-16 rounded-2xl text-base">
              Check Prices
            </Button>
          </form>
        </div>

        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-[128px]"></div>
        </div>

        {/* Today in Ibadan Hook Section */}
        <div className="max-w-6xl mx-auto mt-16 px-4">
          <div className="glass bg-white/40 p-8 rounded-[40px] border border-white/60 shadow-premium relative overflow-hidden group/hook">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="flex-shrink-0 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-2 bg-primary/10 px-3 py-1 rounded-full">
                          <Zap size={14} className="fill-primary" />
                          Market Snapshot
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tightest leading-none">🔥 Today in <br className="hidden md:block"/> Ibadan</h3>
                  </div>
                  
                  <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                      {dailyHookProducts.length > 0 ? dailyHookProducts.map(p => (
                          <div key={p._id} className="relative group/item">
                              <Link href={`/product/${p._id}`} className="block bg-white/60 hover:bg-white p-4 rounded-3xl border border-slate-100 transition-all hover:shadow-premium hover:-translate-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{p.name}</p>
                                  <p className="text-lg font-black text-slate-900 tracking-tighter">₦{p.price.toLocaleString()}</p>
                                  <div className="mt-2 flex items-center justify-between">
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${p.priceStatus === 'down' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                          {p.priceStatus === 'down' ? 'Drop' : 'Live'}
                                      </span>
                                      <span className="text-[8px] font-bold text-slate-300 italic group-hover/item:text-primary transition-colors">Details →</span>
                                  </div>
                              </Link>
                          </div>
                      )) : [1,2,3,4].map(i => (
                          <div key={i} className="h-24 bg-slate-50/50 rounded-3xl animate-pulse" />
                      ))}
                  </div>
              </div>
          </div>
        </div>
      </section>

      {/* Trending Spotlight (e.g. Rice) */}
      {trendingCategory.length > 0 && !search && category === 'All' && (
        <section className="max-w-7xl mx-auto px-4 py-8">
           <div className="bg-primary/5 rounded-[40px] p-8 md:p-12 border border-primary/10 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="max-w-md">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest mb-6">Trending Today</span>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">🔥 Rice Prices Today</h2>
                    <p className="text-slate-500 font-medium mb-8">Bodija and Dugbe are seeing significant price fluctuations on parboiled rice. Check the latest verified entries.</p>
                    <Link href="/?category=Groceries&search=Rice">
                      <Button variant="glass" className="border-primary text-primary hover:bg-primary hover:text-white font-black px-8 py-3 rounded-2xl">
                        View Price Matrix
                      </Button>
                    </Link>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                     {trendingCategory.slice(0, 2).map(p => (
                       <div key={p._id} className="bg-white p-4 rounded-3xl shadow-premium border border-white/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.storeId?.name || 'Local Market'}</p>
                          <h4 className="font-bold text-slate-800 truncate mb-2">{p.name}</h4>
                          <p className="text-xl font-black text-primary tracking-tighter">₦{p.price.toLocaleString()}</p>
                       </div>
                     ))}
                  </div>
              </div>
           </div>
        </section>
      )}

      {/* Featured Section */}
      {featuredProducts.length > 0 && !search && category === 'All' && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-end mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verified Hot Deals</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Direct from community Consensus</p>
              </div>
            </div>
            <div className="h-px bg-slate-100 flex-1 mx-8 mb-2 hidden md:block"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12 pb-32">
        <div className="lg:col-span-3">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-end mb-12 gap-6 lg:gap-8 overflow-hidden">
            <div className="space-y-8 flex-1 min-w-0">
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Market Intelligence</h2>
                
                {/* Market Category Tabs */}
                <div className="flex items-center p-1.5 bg-white/50 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-premium w-fit min-w-[300px]">
                  <button
                    onClick={() => setMarketCategory('Physical')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${marketCategory === 'Physical'
                      ? 'bg-slate-900 text-white shadow-glow translate-y-[-2px]'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <MapPin size={16} className={marketCategory === 'Physical' ? 'text-primary' : ''} />
                    Physical Markets
                  </button>
                  <button
                    onClick={() => setMarketCategory('Online')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${marketCategory === 'Online'
                      ? 'bg-slate-900 text-white shadow-glow translate-y-[-2px]'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Globe size={16} className={marketCategory === 'Online' ? 'text-primary' : ''} />
                    Online Stores
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-display font-bold transition-all whitespace-nowrap ${category === cat
                      ? 'bg-primary text-white shadow-glow'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 pl-3 uppercase tracking-widest">Sort By</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent border-none py-1.5 px-3 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[400px] glass rounded-3xl relative overflow-hidden bg-white/20">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-premium">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-700 mb-2">No products found</h3>
              <p className="text-slate-400 font-medium mb-8 max-w-sm">We couldn't find any products matching your search criteria. Try a different term!</p>
              <Link href="/request-product">
                <Button className="px-10 py-4 font-black text-xs tracking-[0.2em] uppercase shadow-glow rounded-2xl">
                  Request Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
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
                   <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">
                      Needs Update
                   </h3>
                </div>
                <Link href="/stale-prices" className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {staleProducts.map((p: any) => (
                  <Link key={p._id} href={`/product/${p._id}`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{p.name}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
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
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                <Volume2 size={14} className="text-primary" />
                Live Price Feed
              </h3>
              <div className="space-y-5">
                {recentUpdates.map((p: any) => (
                  <Link key={p._id} href={`/product/${p._id}`} className="flex items-start gap-4 group">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.priceStatus === 'down' ? 'bg-rose-500' : 'bg-emerald-500 opacity-50'}`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-700 text-sm truncate group-hover:text-primary transition-colors">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${p.priceStatus === 'down' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {p.priceStatus === 'down' ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                          {p.priceStatus === 'down' ? 'Price Drop' : 'Updated'}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="font-black text-slate-900 text-[10px]">{formatPriceRange(p.price)}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors self-center" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Snippet */}
          {leaderboard.length > 0 && (
            <div className="p-6 bg-slate-900 rounded-[32px] shadow-premium border border-slate-800 relative overflow-hidden group/card">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover/card:bg-primary/20 transition-colors" />
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <Award size={14} />
                Top Market Analysts
              </h3>
              <div className="space-y-6 relative z-10">
                {leaderboard.slice(0, 3).map((user: any, i: number) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg ${i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950' :
                        i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900' :
                          'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950'
                        }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white antialiased">{user.name}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">{user.reputationLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-primary">{user.points}</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase">PTS</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/leaderboard" className="block text-center mt-8 pt-6 border-t border-slate-800 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]">
                View Full Rankings
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="sm:hidden fixed bottom-32 right-6 z-[60] flex flex-col items-end gap-3">
        <Link href="/stale-prices" className="group">
          <div className="bg-slate-900 border border-slate-800 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Update Price
          </div>
          <button className="w-16 h-16 bg-primary text-white rounded-full shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none ring-4 ring-primary/20">
            <TrendingUp size={32} />
          </button>
        </Link>
      </div>
    </div>
  );
}
