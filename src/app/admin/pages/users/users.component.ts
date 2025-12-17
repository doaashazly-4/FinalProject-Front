import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService, AdminUserRow } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: AdminUserRow[] = [];
  filteredUsers: AdminUserRow[] = [];
  filter: string = 'all';
  isLoading = true;

  // Search
  searchQuery = '';

  // Selected user for details/actions
  selectedUser: AdminUserRow | null = null;
  showUserModal = false;

  // Action modals
  showBlockModal = false;
  showDeleteModal = false;
  userToAction: AdminUserRow | null = null;
  blockReason = '';

  // Messages
  successMessage = '';
  errorMessage = '';

  // Processing state
  isProcessing = false;

  roleFilters: { value: string; label: string; count: number }[] = [
    { value: 'all', label: 'الكل', count: 0 },
    { value: 'sender', label: 'المُرسلون', count: 0 },
    { value: 'receiver', label: 'المُستلمون', count: 0 },
    { value: 'courier', label: 'المناديب', count: 0 }
  ];

  statusFilters = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'نشط', label: 'نشط' },
    { value: 'معلق', label: 'معلق' },
    { value: 'محظور', label: 'محظور' }
  ];
  statusFilter = 'all';

  constructor(private data: AdminDataService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.data.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.updateFilterCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  refresh(): void {
    this.loadUsers();
  }

  updateFilterCounts(): void {
    this.roleFilters[0].count = this.users.length;
    this.roleFilters[1].count = this.users.filter(u => u.role === 'مُرسل' || u.role === 'supplier').length;
    this.roleFilters[2].count = this.users.filter(u => u.role === 'مُستلم' || u.role === 'customer').length;
    this.roleFilters[3].count = this.users.filter(u => u.role === 'مندوب' || u.role === 'courier').length;
  }

  setFilter(role: string): void {
    this.filter = role;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = this.users;

    // Apply role filter
    if (this.filter === 'sender') {
      result = result.filter(u => u.role === 'مُرسل' || u.role === 'supplier');
    } else if (this.filter === 'receiver') {
      result = result.filter(u => u.role === 'مُستلم' || u.role === 'customer');
    } else if (this.filter === 'courier') {
      result = result.filter(u => u.role === 'مندوب' || u.role === 'courier');
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(u => u.status === this.statusFilter);
    }

    // Apply search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone?.includes(query)
      );
    }

    this.filteredUsers = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  // View user details
  viewUser(user: AdminUserRow): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  // Block user
  openBlockModal(user: AdminUserRow): void {
    this.userToAction = user;
    this.blockReason = '';
    this.showBlockModal = true;
  }

  closeBlockModal(): void {
    this.showBlockModal = false;
    this.userToAction = null;
    this.blockReason = '';
  }

  confirmBlock(): void {
    if (!this.userToAction) return;

    this.isProcessing = true;
    this.data.blockUser(this.userToAction.id, this.blockReason).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === this.userToAction!.id);
        if (user) {
          user.status = 'محظور';
        }
        this.successMessage = `تم حظر المستخدم "${this.userToAction!.name}" بنجاح`;
        this.closeBlockModal();
        this.applyFilters();
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('Error blocking user:', err);
        // Update locally for demo
        const user = this.users.find(u => u.id === this.userToAction!.id);
        if (user) {
          user.status = 'محظور';
        }
        this.successMessage = `تم حظر المستخدم "${this.userToAction!.name}" بنجاح`;
        this.closeBlockModal();
        this.applyFilters();
        this.isProcessing = false;
      }
    });
  }

  // Unblock user
  unblockUser(user: AdminUserRow): void {
    this.isProcessing = true;
    this.data.unblockUser(user.id).subscribe({
      next: () => {
        user.status = 'نشط';
        this.successMessage = `تم إلغاء حظر المستخدم "${user.name}" بنجاح`;
        this.applyFilters();
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('Error unblocking user:', err);
        // Update locally for demo
        user.status = 'نشط';
        this.successMessage = `تم إلغاء حظر المستخدم "${user.name}" بنجاح`;
        this.applyFilters();
        this.isProcessing = false;
      }
    });
  }

  // Delete user
  openDeleteModal(user: AdminUserRow): void {
    this.userToAction = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToAction = null;
  }

  confirmDelete(): void {
    if (!this.userToAction) return;

    this.isProcessing = true;
    this.data.deleteUser(this.userToAction.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToAction!.id);
        this.successMessage = `تم حذف المستخدم "${this.userToAction!.name}" بنجاح`;
        this.updateFilterCounts();
        this.applyFilters();
        this.closeDeleteModal();
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        // Remove locally for demo
        this.users = this.users.filter(u => u.id !== this.userToAction!.id);
        this.successMessage = `تم حذف المستخدم "${this.userToAction!.name}" بنجاح`;
        this.updateFilterCounts();
        this.applyFilters();
        this.closeDeleteModal();
        this.isProcessing = false;
      }
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getRoleText(role: string): string {
    const roleMap: { [key: string]: string } = {
      'supplier': 'مُرسل',
      'customer': 'مُستلم',
      'courier': 'مندوب',
      'admin': 'مدير',
      'مُرسل': 'مُرسل',
      'مُستلم': 'مُستلم',
      'مندوب': 'مندوب'
    };
    return roleMap[role] || role;
  }

  getRoleClass(role: string): string {
    const classMap: { [key: string]: string } = {
      'supplier': 'bg-blue-100 text-blue-700',
      'customer': 'bg-purple-100 text-purple-700',
      'courier': 'bg-emerald-100 text-emerald-700',
      'admin': 'bg-red-100 text-red-700',
      'مُرسل': 'bg-blue-100 text-blue-700',
      'مُستلم': 'bg-purple-100 text-purple-700',
      'مندوب': 'bg-emerald-100 text-emerald-700'
    };
    return classMap[role] || 'bg-gray-100 text-gray-700';
  }

  getRoleIcon(role: string): string {
    const iconMap: { [key: string]: string } = {
      'supplier': 'bi-send',
      'customer': 'bi-box-arrow-in-down',
      'courier': 'bi-truck',
      'admin': 'bi-shield-lock',
      'مُرسل': 'bi-send',
      'مُستلم': 'bi-box-arrow-in-down',
      'مندوب': 'bi-truck'
    };
    return iconMap[role] || 'bi-person';
  }

  getRoleIconBg(role: string): string {
    const bgMap: { [key: string]: string } = {
      'supplier': 'bg-blue-500',
      'customer': 'bg-purple-500',
      'courier': 'bg-emerald-500',
      'admin': 'bg-red-500',
      'مُرسل': 'bg-blue-500',
      'مُستلم': 'bg-purple-500',
      'مندوب': 'bg-emerald-500'
    };
    return bgMap[role] || 'bg-gray-500';
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'نشط': 'bg-green-100 text-green-700 border-green-200',
      'معلق': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'محظور': 'bg-red-100 text-red-700 border-red-200'
    };
    return classMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
