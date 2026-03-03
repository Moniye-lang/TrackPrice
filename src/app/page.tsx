'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Input, Button } from '@/components/ui-base';
import Link from 'next/link';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

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
      {/* Header */}
      <header className="glass sticky top-4 z-50 mx-4 mt-4 rounded-2xl shadow-premium">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform">
            TrackPrice<span className="text-accent">.</span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/forum" className="text-slate-600 hover:text-primary font-display font-semibold transition-colors relative group">
              Forum
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Button variant="primary" className="hidden sm:flex">
              Sign Up
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            LIVE PRICE TRACKING
          </div>
          <h1 className="text-6xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
            Track Prices in <span className="text-primary italic">Real-Time</span>
          </h1>
          <p className="text-slate-500 mb-10 text-xl font-medium max-w-2xl mx-auto">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trending Deals</h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[400px] glass rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 glass rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-2xl font-black text-slate-700 mb-2">No deals found</h3>
            <p className="text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
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
