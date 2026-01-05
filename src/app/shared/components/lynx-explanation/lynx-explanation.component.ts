import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignmentObservation } from '../../../models/assignment-observation.model';

@Component({
    selector: 'app-lynx-explanation',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lynx-explanation.component.html',
    styleUrls: ['./lynx-explanation.component.css']
})
export class LynxExplanationComponent {
    @Input() observation: AssignmentObservation | null = null;
}
