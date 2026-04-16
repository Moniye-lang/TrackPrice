import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'glass' }>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-white hover:shadow-glow hover:scale-[1.02] shadow-md',
            secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            danger: 'bg-rose-500 text-white hover:bg-rose-600',
            glass: 'glass text-primary hover:bg-white/40',
        };
        return (
            <button
                ref={ref}
                className={cn(
                    "px-6 py-2.5 rounded-xl font-display font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder:text-slate-400",
                    className
                )}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, className, ...props }, ref) => (
        <div ref={ref} className={cn("bg-white rounded-2xl shadow-premium border border-slate-100 overflow-hidden transition-all duration-300", className)} {...props}>
            {children}
        </div>
    )
);
Card.displayName = "Card";

export { Button, Input, Card, cn };
