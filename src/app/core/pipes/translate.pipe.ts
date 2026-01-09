import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Must be impure to detect signal changes if not using async pipe explicitly
})
export class TranslatePipe implements PipeTransform {
    constructor(private translationService: TranslationService) { }

    transform(key: string): string {
        return this.translationService.translate(key);
    }
}
