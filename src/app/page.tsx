import { TrendingUp, TrendingDown, Clock, Search, Award, Sparkles, ChevronRight, AlertCircle, Volume2 } from 'lucide-react';

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
        setLeaderboard(data.users || []);
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
            Track Prices in <span className="text-primary italic">Real-Time</span>
          </h1>
          <p className="text-slate-500 mb-10 text-lg md:text-xl font-medium max-w-2xl mx-auto px-4">
            Never miss a deal again. Monitor price drops, set alerts, and discuss with the community anonymously.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto bg-white/40 p-2 rounded-3xl border border-white/60 shadow-2xl backdrop-blur-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <Input
                className="border-none bg-transparent focus:ring-0 text-slate-800 text-lg px-12 h-14"
                placeholder="Search premium products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-glow font-black h-14 rounded-2xl">
              Explore
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
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                   <AlertCircle size={14} className="text-rose-500" />
                   Needs Update
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
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
                        14+ Days Old
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
    </div>
  );
}
