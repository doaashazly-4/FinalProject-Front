import { Injectable, signal, computed, effect } from '@angular/core';
import { AR_TRANSLATIONS } from '../i18n/ar';
import { EN_TRANSLATIONS } from '../i18n/en';

export type Language = 'ar' | 'en';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private _currentLang = signal<Language>('ar');

    public lang = this._currentLang.asReadonly();
    public dir = computed(() => this._currentLang() === 'ar' ? 'rtl' : 'ltr');

    private translations = computed(() => {
        return this._currentLang() === 'ar' ? AR_TRANSLATIONS : EN_TRANSLATIONS;
    });

    constructor() {
        // Load saved language
        const savedLang = localStorage.getItem('lang') as Language;
        if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
            this._currentLang.set(savedLang);
        } else {
            this._currentLang.set('ar'); // Default
        }

        // Effect to update DOM
        effect(() => {
            document.documentElement.lang = this._currentLang();
            document.documentElement.dir = this.dir();
            localStorage.setItem('lang', this._currentLang());
        });
    }

    setLanguage(lang: Language) {
        this._currentLang.set(lang);
    }

    toggleLanguage() {
        this.setLanguage(this._currentLang() === 'ar' ? 'en' : 'ar');
    }

    // Compatibility Method
    currentLang(): Language {
        return this.lang();
    }

    isRtl(): boolean {
        return this.dir() === 'rtl';
    }

    // Helper to access nested keys safely (e.g. 'HERO.TITLE')
    translate(key: string): string {
        const keys = key.split('.');
        let result: any = this.translations();

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                return key; // Fallback
            }
        }

        return typeof result === 'string' ? result : key;
    }
}
