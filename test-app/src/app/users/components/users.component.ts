import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { User } from '../models/user.model';
import { UserService } from '../services/users.service';
import { SortDirection, SortOption, SortState } from '../../shared/models/sorting.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false,
})
export class UsersComponent implements OnInit, OnDestroy {
  @Input() title = 'Users List';
  @Input() limit: number | null = null;

  users: User[] = [];
  allUsers: User[] = [];
  
  // Loading and error states
  loading = false;
  error: string | null = null;
  
  // Filtering
  filterText = '';
  private filterTextChanged = new Subject<string>();
  
  // Sorting
  sortOptions: SortOption[] = [
    { field: 'name', displayName: 'Name' },
    { field: 'email', displayName: 'Email' },
    { field: 'role', displayName: 'Role' },
    { field: 'createdAt', displayName: 'Created Date' }
  ];
  
  currentSort: SortState = {
    field: 'name',
    direction: 'asc'
  };
  
  // Cleanup
  public destroy$ = new Subject<void>();

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getUsers();
    
    // Set up filter debounce to avoid too many filtering operations
    this.filterTextChanged.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filterText => {
      this.filterUsers(filterText);
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUsers(): void {
    this.loading = true;
    this.error = null;
    
    this.userService.getUsers()
      .subscribe({
        next: (data) => {
          this.allUsers = data;
          // Apply initial sorting
          this.sortUsers(this.currentSort.field, this.currentSort.direction);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load users. Please try again later.';
          this.loading = false;
          console.error('Error fetching users:', err);
        }
      });
  }
  
  onFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterTextChanged.next(value);
  }
  
  filterUsers(filterText: string): void {
    this.filterText = filterText.toLowerCase().trim();
    
    if (!this.filterText) {
      // If no filter, just re-apply the current sort to all users
      this.sortUsers(this.currentSort.field, this.currentSort.direction);
      return;
    }
    
    // Filter users based on name, email, or role
    const filtered = this.allUsers.filter(user => 
      user.name.toLowerCase().includes(this.filterText) ||
      user.email.toLowerCase().includes(this.filterText) ||
      (user.role && user.role.toLowerCase().includes(this.filterText))
    );
    
    // Apply current sort to filtered results
    this.users = this.applySorting(filtered, this.currentSort.field, this.currentSort.direction);
    
    // Apply limit if needed
    if (this.limit) {
      this.users = this.users.slice(0, this.limit);
    }
  }
  
  sortUsers(field: string, direction?: SortDirection): void {
    // If no direction provided, toggle current direction or default to 'asc'
    if (!direction) {
      direction = (field === this.currentSort.field && this.currentSort.direction === 'asc') 
        ? 'desc' 
        : 'asc';
    }
    
    // Update current sort state
    this.currentSort = { field, direction };
    
    // Apply sorting to either all users or filtered users
    const dataToSort = this.filterText 
      ? this.users 
      : [...this.allUsers];
    
    this.users = this.applySorting(dataToSort, field, direction);
    
    // Apply limit if needed
    if (this.limit) {
      this.users = this.users.slice(0, this.limit);
    }
  }
  
  private applySorting(data: User[], field: string, direction: SortDirection): User[] {
    return [...data].sort((a, b) => {
      let valueA = a[field as keyof User];
      let valueB = b[field as keyof User];
      
      // Handle possible undefined values
      if (valueA === undefined) return direction === 'asc' ? -1 : 1;
      if (valueB === undefined) return direction === 'asc' ? 1 : -1;
      
      // Special handling for dates
      if (field === 'createdAt') {
        valueA = valueA instanceof Date ? valueA : new Date(valueA as string);
        valueB = valueB instanceof Date ? valueB : new Date(valueB as string);
      }
      
      // String comparison for string values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Numeric comparison for numbers or dates
      return direction === 'asc' 
        ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
        : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
    });
  }
  
  getSortIcon(field: string): string {
    if (field !== this.currentSort.field) {
      return 'sort'; // Default icon
    }
    return this.currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  retry(): void {
    this.getUsers();
  }
  
  clearFilter(): void {
    this.filterText = '';
    this.filterTextChanged.next('');
  }
}