import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierDataService } from '../../../supplier/services/supplier-data.service';
import { AssignmentObservation } from '../../../models/assignment-observation.model';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-lynx-talisman',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lynx-talisman.component.html',
    styleUrls: ['./lynx-talisman.component.css'],
    animations: [
        trigger('talismanReveal', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8) translateY(10px)' }),
                animate('0.4s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('0.3s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 0, transform: 'scale(0.9) translateY(10px)' }))
            ])
        ])
    ]
})
export class LynxTalismanComponent {
    @Input() requestId!: string;

    isOpen = false;
    isLoading = false;
    explanation: AssignmentObservation | null = null;
    hasError = false;

    constructor(private supplierService: SupplierDataService) { }

    toggleTalisman(): void {
        this.isOpen = !this.isOpen;

        if (this.isOpen && !this.explanation && !this.hasError) {
            this.consultOracle();
        }
    }

    private consultOracle(): void {
        this.isLoading = true;
        this.hasError = false;

        // Simulate "Scrying" delay for effect if needed, but we'll fetch directly
        // A small artificial delay can make it feel more "processed" if the API is too fast,
        // but usually best to just show it when ready.
        this.supplierService.getAssignmentExplanation(this.requestId).subscribe({
            next: (data) => {
                this.explanation = data;
                this.isLoading = false;
                if (!data) {
                    // Handle case where 200 OK but null body? Or strict null check?
                    // The service returns null on error (catchError).
                    this.hasError = true;
                }
            },
            error: () => {
                this.isLoading = false;
                this.hasError = true;
            }
        });
    }

    get isSystemDecision(): boolean {
        return this.explanation?.source === 'SYSTEM';
    }
}
