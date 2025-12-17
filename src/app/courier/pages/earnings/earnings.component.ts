import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourierDataService, CourierEarnings } from '../../services/courier-data.service';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './earnings.component.html',
  styleUrls: ['./earnings.component.css']
})
export class EarningsComponent implements OnInit {
  earnings: CourierEarnings | null = null;
  isLoading = true;

  constructor(private dataService: CourierDataService) {}

  ngOnInit(): void {
    this.loadEarnings();
  }

  loadEarnings(): void {
    this.isLoading = true;
    this.dataService.getEarnings().subscribe({
      next: (earnings) => {
        this.earnings = earnings;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading earnings:', err);
        this.isLoading = false;
      }
    });
  }
}

