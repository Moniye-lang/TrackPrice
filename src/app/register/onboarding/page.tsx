'use client';

import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui-base';
import { ArrowRight, CheckCircle, Search, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-primary/30">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />
            </div>

            <div className="max-w-3xl w-full relative z-10">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighest mb-4">You're in! 🎉</h1>
                    <p className="text-lg text-slate-400 font-medium">Here is how to update prices and help the community in 3 simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { 
                            icon: <Search className="text-primary" size={32} />, 
                            title: "Find a Product", 
                            desc: "Search for everyday items you just saw in the market.",
                            delay: "100ms"
                        },
                        { 
                            icon: <Edit3 className="text-amber-400" size={32} />, 
                            title: "Propose Price", 
                            desc: "Click 'Update Price', enter the new price, and submit.",
                            delay: "300ms"
                        },
                        { 
                            icon: <CheckCircle className="text-emerald-400" size={32} />, 
                            title: "Get Verified", 
                            desc: "Once the community confirms your price, it becomes official!",
                            delay: "500ms"
                        }
                    ].map((step, idx) => (
                        <Card key={idx} className={`bg-slate-800/50 border-slate-700 backdrop-blur-xl p-8 hover:bg-slate-800 transition-colors animate-in fade-in zoom-in-95 duration-500`} style={{ animationDelay: step.delay }}>
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-inner border border-slate-800">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">{step.title}</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed">{step.desc}</p>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
                    <Link href="/" className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full sm:w-auto py-4 px-10 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-black tracking-widest uppercase text-xs border-none">
                            Skip for now
                        </Button>
                    </Link>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto py-4 px-10 shadow-glow font-black tracking-widest uppercase text-xs flex items-center gap-2 group">
                            Start Contributing
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
