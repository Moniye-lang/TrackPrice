'use client';

import { useState, useEffect, TransitionStartFunction } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Globe, Building2 } from 'lucide-react';
import { Input, Button } from '@/components/ui-base';

interface Store {
    _id: string;
    name: string;
    area: string;
    city: string;
}

interface FilterSectionProps {
    stores: Store[];
    categories: string[];
}

export function FilterSection({ stores, categories }: FilterSectionProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Internal state for search input to prevent jumpy URL updates
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    
    // Sync internal search term with URL if URL changes externally
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
    }, [searchParams]);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'All') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        
        // Reset page when category or search changes
        if (key !== 'page') {
            params.delete('page');
        }
        
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // When city changes, clear the storeId filter too (different scope)
    const updateCityFilter = (city: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (city && city !== 'All') {
            params.set('city', city);
        } else {
            params.delete('city');
        }
        params.delete('storeId'); // reset market when city changes
        params.delete('page');
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter('search', searchTerm);
    };

    const activeCategory = searchParams.get('category') || 'All';
    const activeMarketCategory = searchParams.get('marketCategory') || 'Physical';
    const activeCity = searchParams.get('city') || 'All';
    const activeStoreId = searchParams.get('storeId') || 'All';

    // Derive unique cities from stores list
    const cities = ['All', ...Array.from(new Set(stores.map(s => s.city).filter(Boolean))).sort()];

    // Filter stores to only show those in the selected city
    const filteredStores = activeCity === 'All' ? stores : stores.filter(s => s.city === activeCity);

    return (
        <div className="space-y-8">
            {/* Hero Search Section */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto bg-white/95 p-2 rounded-3xl border border-white/60 shadow-2xl">
                <div className="relative flex-[2]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <Input
                        className="border-none bg-transparent focus:ring-0 text-slate-800 text-lg px-16 h-16 w-full"
                        placeholder="Search rice, eggs, oil, bread..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search for products"
                    />
                </div>
                
                <div className="h-10 w-px bg-slate-200 self-center hidden sm:block" />

                <div className="relative flex-1 group/market">
                    <span className="absolute -top-6 left-4 text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover/market:opacity-100 group-focus-within/market:opacity-100 transition-opacity">
                        Specific Market
                    </span>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <MapPin className="text-primary/60 relative z-10" size={20} aria-hidden="true" />
                        <span className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150" />
                    </div>
                    <select
                        id="market-selector"
                        value={activeStoreId}
                        onChange={(e) => updateFilter('storeId', e.target.value)}
                        className="w-full h-16 bg-transparent border-none pl-12 pr-4 text-xs font-black text-slate-700 focus:ring-0 cursor-pointer outline-none appearance-none"
                    >
                        <option value="All">All Markets</option>
                        {filteredStores.map((s) => (
                            <option key={s._id} value={s._id}>{s.name} ({s.area})</option>
                        ))}
                    </select>
                </div>

                <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-glow font-black h-16 rounded-2xl text-base">
                    Check Prices
                </Button>
            </form>

            <div className="space-y-12">
                {/* Header Section: Centered Market Intelligence & Filters */}
                <div className="flex flex-col items-center space-y-8 relative">
                    <div className="flex flex-col items-center gap-6 w-full">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center">Market Intelligence</h2>
                        
                        {/* Market Category Tabs */}
                        <div className="flex items-center justify-center p-1.5 bg-white/95 rounded-[2rem] border border-slate-100 shadow-premium w-fit min-w-[320px]">
                            <button
                                onClick={() => updateFilter('marketCategory', 'Physical')}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeMarketCategory === 'Physical'
                                    ? 'bg-slate-900 text-white shadow-glow translate-y-[-2px]'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <MapPin size={16} className={activeMarketCategory === 'Physical' ? 'text-primary' : ''} />
                                Physical Markets
                            </button>
                            <button
                                onClick={() => updateFilter('marketCategory', 'Online')}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeMarketCategory === 'Online'
                                    ? 'bg-slate-900 text-white shadow-glow translate-y-[-2px]'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Globe size={16} className={activeMarketCategory === 'Online' ? 'text-primary' : ''} />
                                Online Stores
                            </button>
                        </div>

                        {/* City / State Filter Row */}
                        <div className="flex items-center gap-3 flex-wrap justify-center bg-white/40 p-2 rounded-2xl border border-white/60">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 border-r border-slate-200">
                                <Building2 size={12} /> City
                            </span>
                            <div className="flex items-center gap-2">
                                {cities.map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => updateCityFilter(city)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeCity === city
                                            ? 'bg-primary text-white shadow-glow-sm'
                                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                                            }`}
                                    >
                                        {city === 'All' ? 'All Cities' : city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Filters: Categories & Sort */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pt-4 border-t border-slate-100/50">
                    {/* Category Pills (Centered or Left-aligned on Desktop) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 flex-1 justify-center lg:justify-start">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => updateFilter('category', cat)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-display font-bold transition-all whitespace-nowrap ${activeCategory === cat
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sort Dropdown (Right-aligned) */}
                    <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-xl border border-slate-100 shadow-sm flex-shrink-0">
                        <span className="text-[10px] font-black text-slate-400 pl-3 uppercase tracking-widest">Sort By</span>
                        <select
                            value={searchParams.get('sort') || 'newest'}
                            onChange={(e) => updateFilter('sort', e.target.value)}
                            className="bg-transparent border-none py-1.5 px-3 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="newest">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="updated">Recently Updated</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

