'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { Input, Button } from '@/components/ui-base';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [staleProducts, setStaleProducts] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchHomepageData = async () => {
    try {
      const [featRes, staleRes, recentRes, leaderRes] = await Promise.all([
        fetch('/api/products?featured=true'),
        fetch('/api/products?stale=true'),
        fetch('/api/products?sort=updated'),
        fetch('/api/leaderboard'),
      ]);

      if (featRes.ok) setFeaturedProducts((await featRes.json()).slice(0, 4));
      if (staleRes.ok) setStaleProducts((await staleRes.json()).slice(0, 5));
      if (recentRes.ok) setRecentUpdates((await recentRes.json()).slice(0, 5));
      if (leaderRes.ok) {
        const data = await leaderRes.json();
        setLeaderboard(data.users || []); // leaderboard endpoint returns { users, cities }
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
  }, [category, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-mesh selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            LIVE PRICE TRACKING
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
            Track Prices in <span className="text-primary italic">Real-Time</span>
          </h1>
          <p className="text-slate-500 mb-10 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Never miss a deal again. Monitor price drops, set alerts, and discuss with the community anonymously.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white/40 p-2 rounded-2xl border border-white/60 shadow-2xl backdrop-blur-xl">
            <Input
              className="border-none bg-transparent focus:ring-0 text-slate-800 text-lg px-6"
              placeholder="Search premium products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-glow">
              Explore Deals
            </Button>
          </form>
        </div>

        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-[128px]"></div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredProducts.length > 0 && !search && category === 'All' && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Featured Prices</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Verified & Popular</p>
            </div>
            <div className="h-px bg-slate-100 flex-1 mx-8 mb-2 hidden md:block"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-end mb-12 gap-6 lg:gap-8 overflow-hidden">
            <div className="space-y-4 flex-1 min-w-0">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trending Deals</h2>
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
              <span className="text-xs font-bold text-slate-400 pl-3">SORT BY</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent border-none py-1.5 px-3 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer"
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
                <div key={i} className="h-[400px] glass rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-2xl font-black text-slate-700 mb-2">No products found</h3>
              <p className="text-slate-400 font-medium mb-6">Can't find what you're looking for? Help the community by requesting it!</p>
              <Link href="/request-product">
                <Button className="px-8 py-3 font-black text-sm tracking-widest uppercase shadow-glow">
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
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Needs Update</h3>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <div className="space-y-4">
                {staleProducts.map((p: any) => (
                  <Link key={p._id} href={`/product/${p._id}`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{p.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stale for 14+ days</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently Updated */}
          {recentUpdates.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Live Feed</h3>
              <div className="space-y-4">
                {recentUpdates.map((p: any) => (
                  <Link key={p._id} href={`/product/${p._id}`} className="flex items-center gap-4 group">
                    <div className={`w-2 h-2 rounded-full ${p.priceStatus === 'down' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-700 text-sm truncate">{p.name}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform ${p.priceStatus === 'down' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                        {p.priceStatus === 'down' ? 'Price Dropped' : 'Just Updated'}
                      </p>
                    </div>
                    <span className="font-black text-slate-900 text-xs">₦{p.price.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Snippet */}
          {leaderboard.length > 0 && (
            <div className="p-6 bg-slate-900 rounded-3xl shadow-premium border border-slate-800">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-6">Top Analysts</h3>
              <div className="space-y-6">
                {leaderboard.slice(0, 3).map((user: any, i: number) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-400 text-amber-900' :
                        i === 1 ? 'bg-slate-300 text-slate-800' :
                          'bg-orange-400 text-orange-900'
                        }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{user.name}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user.reputationLevel}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-primary">{user.points} pts</p>
                  </div>
                ))}
              </div>
              <Link href="/leaderboard" className="block text-center mt-8 pt-6 border-t border-slate-800 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest">
                View Full Rankings
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
