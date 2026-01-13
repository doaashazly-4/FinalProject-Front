import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupplierDataService, SupplierProduct } from '../../services/supplier-data.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-supplier-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductsComponent implements OnInit {
  products: SupplierProduct[] = [];
  filteredProducts: SupplierProduct[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'all';
  isLoading = true;

  stats = {
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0
  };

  showDeleteConfirmModal = false;
  deletingProductId: string | null = null;

  constructor(
    private data: SupplierDataService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.data.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...this.products];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.products = [];
        this.filteredProducts = [];
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.products.length;
    this.stats.active = this.products.filter(p => p.isActive).length;
    this.stats.lowStock = this.products.filter(p => p.quantity <= 10 && p.quantity > 0).length;
    this.stats.outOfStock = this.products.filter(p => p.quantity === 0).length;
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || product.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'pending': 'قيد المراجعة'
    };
    return statusMap[status] || status;
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 10) return 'low-stock';
    return 'in-stock';
  }

  getStockText(quantity: number): string {
    if (quantity === 0) return 'نفذ من المخزون';
    if (quantity <= 10) return `منخفض (${quantity})`;
    return `متوفر (${quantity})`;
  }

  deleteProduct(productId: string): void {
    this.deletingProductId = productId;
    this.showDeleteConfirmModal = true;
  }

  confirmDelete(): void {
    if (!this.deletingProductId) return;
    this.data.deleteProduct(this.deletingProductId).subscribe({
      next: () => {
        this.notificationService.showNotification({ title: '✅ تم', message: 'تم حذف المنتج بنجاح', type: 'success' });
        this.loadProducts();
        this.showDeleteConfirmModal = false;
        this.deletingProductId = null;
      },
      error: (err) => {
        console.error('خطأ في حذف المنتج:', err);
        this.notificationService.showNotification({ title: '❌ خطأ', message: 'حدث خطأ أثناء حذف المنتج', type: 'error' });
        this.showDeleteConfirmModal = false;
        this.deletingProductId = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.deletingProductId = null;
  }
}
