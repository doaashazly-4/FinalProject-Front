import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentTheme = signal<Theme>('light');
    public theme = this.currentTheme.asReadonly();

    constructor() {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            this.currentTheme.set(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme.set('dark');
        }

        // Effect to update DOM
        effect(() => {
            const root = document.documentElement;
            const theme = this.currentTheme();

            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            localStorage.setItem('theme', theme);
        });
    }

    toggleTheme() {
        this.currentTheme.update(t => t === 'light' ? 'dark' : 'light');
    }
}
