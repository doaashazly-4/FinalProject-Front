import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    // Using a signal matches the usage: langService.currentLang()
    currentLang = signal<string>('ar');

    constructor() {
        // Check localStorage if needed, or default to 'ar'
        const savedLang = localStorage.getItem('lang');
        if (savedLang) {
            this.currentLang.set(savedLang);
        }
    }

    setLanguage(lang: string) {
        this.currentLang.set(lang);
        localStorage.setItem('lang', lang);

        // Optional: Direction handling
        if (lang === 'ar') {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = 'ar';
        } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = 'en';
        }
    }

    isRtl(): boolean {
        return this.currentLang() === 'ar';
    }
}
