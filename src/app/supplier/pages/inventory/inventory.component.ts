import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupplierDataService, SupplierProduct } from '../../services/supplier-data.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-supplier-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit {
  inventory: SupplierProduct[] = [];
  filteredInventory: SupplierProduct[] = [];
  
  // إحصائيات المخزون
  stats = {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    activeProducts: 0
  };

  // أدوات البحث والتصفية
  searchTerm: string = '';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  isLoading = true;
  
  // أنواع التصفية
  statuses = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'in-stock', label: 'متوفر' },
    { value: 'low-stock', label: 'منخفض' },
    { value: 'out-of-stock', label: 'نفذ' }
  ];

  categories: string[] = [];

  constructor(private data: SupplierDataService) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.isLoading = true;
    
    forkJoin({
      products: this.data.getProducts(),
      categories: this.data.getProductCategories(),
      lowStock: this.data.getLowStockProducts(),
      outOfStock: this.data.getOutOfStockProducts()
    }).subscribe({
      next: (result) => {
        this.inventory = result.products;
        this.filteredInventory = [...this.inventory];
        this.categories = result.categories;
        
        // Calculate stats
        this.stats.totalItems = this.inventory.length;
        this.stats.totalValue = this.inventory.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        this.stats.lowStockItems = result.lowStock.length;
        this.stats.outOfStockItems = result.outOfStock.length;
        this.stats.activeProducts = this.inventory.filter(item => item.isActive).length;
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.inventory = [];
        this.filteredInventory = [];
        this.isLoading = false;
      }
    });
  }

  filterInventory(): void {
    this.filteredInventory = this.inventory.filter(item => {
      // البحث
      const matchesSearch = this.searchTerm === '' || 
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // التصفية حسب الفئة
      const matchesCategory = this.selectedCategory === 'all' || 
        item.category === this.selectedCategory;
      
      // التصفية حسب حالة المخزون
      const matchesStatus = this.selectedStatus === 'all' ||
        (this.selectedStatus === 'in-stock' && item.quantity > 10) ||
        (this.selectedStatus === 'low-stock' && item.quantity > 0 && item.quantity <= 10) ||
        (this.selectedStatus === 'out-of-stock' && item.quantity === 0);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  // الحصول على حالة المخزون كنص
  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'نفذ';
    if (quantity <= 10) return 'منخفض';
    return 'متوفر';
  }

  // الحصول على فئة المخزون للتصنيف
  getStockClass(quantity: number): string {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 10) return 'low-stock';
    return 'in-stock';
  }

  // تحديث كمية المنتج
  updateQuantity(productId: string, newQuantity: number): void {
    if (newQuantity < 0) {
      alert('الكمية لا يمكن أن تكون سالبة');
      return;
    }

    this.data.updateProductQuantity(productId, newQuantity).subscribe({
      next: () => {
        this.loadInventory();
        alert('تم تحديث الكمية بنجاح');
      },
      error: (err) => {
        console.error('خطأ في تحديث الكمية:', err);
        alert('حدث خطأ أثناء تحديث الكمية');
      }
    });
  }

  // زيادة الكمية
  increaseQuantity(product: SupplierProduct): void {
    const newQuantity = product.quantity + 1;
    this.updateQuantity(product.id, newQuantity);
  }

  // تقليل الكمية
  decreaseQuantity(product: SupplierProduct): void {
    if (product.quantity <= 0) return;
    const newQuantity = product.quantity - 1;
    this.updateQuantity(product.id, newQuantity);
  }

  // الحصول على حالة المنتج كنص
  getProductStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'pending': 'قيد المراجعة'
    };
    return statusMap[status] || status;
  }

  // تحميل تقرير المخزون
  downloadInventoryReport(): void {
    const reportData = this.filteredInventory.map(item => ({
      'اسم المنتج': item.name,
      'الفئة': item.category,
      'الكمية': item.quantity,
      'حالة المخزون': this.getStockStatus(item.quantity),
      'السعر': item.price,
      'القيمة الإجمالية': item.price * item.quantity,
      'الحالة': this.getProductStatusText(item.status),
      'تاريخ الإضافة': new Date(item.createdAt).toLocaleDateString('ar-SA')
    }));

    // في التطبيق الحقيقي، هنا سيتم إنشاء وتحميل ملف Excel أو PDF
    console.log('تقرير المخزون:', reportData);
    alert('تم تحميل تقرير المخزون (في النسخة الحقيقية سيتم تنزيل ملف)');
  }
}
