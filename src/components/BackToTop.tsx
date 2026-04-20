'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.pageYOffset > 500) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Scroll the window to the top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div className={`fixed bottom-24 right-6 sm:bottom-10 sm:right-10 z-50 transition-all duration-500 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}>
            <button
                onClick={scrollToTop}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 text-white rounded-2xl shadow-glow hover:shadow-primary/40 hover:bg-primary transition-all flex items-center justify-center group border border-slate-800"
                aria-label="Back to top"
            >
                <ChevronUp className="group-hover:-translate-y-1 transition-transform" size={24} />
            </button>
        </div>
    );
}
