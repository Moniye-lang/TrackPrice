'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui-base';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (page > 1) {
            params.set('page', page.toString());
        } else {
            params.delete('page');
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    if (totalPages <= 1) return null;

    // Generate page numbers logic
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('ellipsis-start');
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('ellipsis-end');
            }

            // Always show last page
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 pt-8 border-t border-slate-100">
            {/* Previous Button */}
            <Button
                variant="secondary"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 disabled:opacity-30 p-0"
                aria-label="Previous page"
            >
                <ChevronLeft size={18} />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                    if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                        return (
                            <div key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-300">
                                <MoreHorizontal size={16} />
                            </div>
                        );
                    }

                    const isCurrent = page === currentPage;
                    return (
                        <button
                            key={`page-${page}`}
                            onClick={() => goToPage(page as number)}
                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-300 ${
                                isCurrent
                                    ? 'bg-slate-900 text-white shadow-glow scale-110 z-10'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm hover:scale-105'
                            }`}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            {/* Next Button */}
            <Button
                variant="secondary"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 disabled:opacity-30 p-0"
                aria-label="Next page"
            >
                <ChevronRight size={18} />
            </Button>
        </div>
    );
}
