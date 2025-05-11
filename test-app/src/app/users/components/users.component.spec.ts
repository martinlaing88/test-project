import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { UserService } from '../services/users.service';
import { User } from '../models/user.model';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  
  // Mock user data for testing
  const mockUsers: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', createdAt: new Date('2023-01-15') },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', createdAt: new Date('2023-02-20') },
    { id: 3, name: 'Carol Williams', email: 'carol@example.com', role: 'Editor', createdAt: new Date('2023-03-10') },
    { id: 4, name: 'Dave Brown', email: 'dave@example.com', role: 'User', createdAt: new Date('2023-04-05') }
  ];

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['getUsers']);
    
    await TestBed.configureTestingModule({
      declarations: [UsersComponent],
      imports: [FormsModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;

    mockUserService.getUsers.and.returnValue(of(mockUsers));
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on initialization', () => {
    fixture.detectChanges();
    
    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(component.allUsers.length).toBe(4);
    expect(component.users.length).toBe(4);
    expect(component.loading).toBeFalse();
  });

  it('should set error when getUsers fails', () => {
    mockUserService.getUsers.and.returnValue(throwError(() => new Error('Failed to fetch users')));
    
    fixture.detectChanges();
    
    expect(component.error).toBe('Failed to load users. Please try again later.');
    expect(component.loading).toBeFalse();
  });

  it('should respect the limit input property', () => {
    component.limit = 2;
    fixture.detectChanges();
    
    expect(component.users.length).toBe(2);
  });

  it('should apply initial sorting by name ascending', () => {
    fixture.detectChanges();

    expect(component.currentSort.field).toBe('name');
    expect(component.currentSort.direction).toBe('asc');
    expect(component.users[0].name).toBe('Alice Johnson');
  });

  it('should sort users when sortUsers is called', () => {
    fixture.detectChanges();

    component.sortUsers('email', 'desc');
    
    expect(component.currentSort.field).toBe('email');
    expect(component.currentSort.direction).toBe('desc');
    expect(component.users[0].email).toBe('dave@example.com');
  });

  it('should toggle sort direction when sorting by the same field', () => {
    fixture.detectChanges();

    expect(component.currentSort.direction).toBe('asc');
    
    component.sortUsers('name');
    
    expect(component.currentSort.field).toBe('name');
    expect(component.currentSort.direction).toBe('desc');
    expect(component.users[0].name).toBe('Dave Brown');
  });

  it('should sort by date correctly', () => {
    fixture.detectChanges();

    component.sortUsers('createdAt', 'asc');
    
    expect(component.users[0].name).toBe('Alice Johnson');
    expect(component.users[3].name).toBe('Dave Brown');

    component.sortUsers('createdAt', 'desc');
    
    expect(component.users[0].name).toBe('Dave Brown');
    expect(component.users[3].name).toBe('Alice Johnson');
  });

  it('should filter users when filter text changes', fakeAsync(() => {
    fixture.detectChanges();

    const event = { target: { value: 'user' } } as unknown as Event;
    component.onFilterChange(event);

    tick(300);

    expect(component.users.length).toBe(2);
    expect(component.users[0].role).toBe('User');
    expect(component.users[1].role).toBe('User');
  }));

  it('should reset filter when clearFilter is called', fakeAsync(() => {
    fixture.detectChanges();

    const event = { target: { value: 'admin' } } as unknown as Event;
    component.onFilterChange(event);
    tick(300);
    expect(component.users.length).toBe(1);

    component.clearFilter();
    tick(300);
    
    expect(component.filterText).toBe('');
    expect(component.users.length).toBe(4);
  }));

  it('should return correct sort icon based on current sort state', () => {
    fixture.detectChanges();

    expect(component.getSortIcon('name')).toBe('arrow_upward');
    expect(component.getSortIcon('email')).toBe('sort');

    component.sortUsers('email', 'desc');
    
    expect(component.getSortIcon('name')).toBe('sort');
    expect(component.getSortIcon('email')).toBe('arrow_downward');
  });

  it('should correctly handle undefined values when sorting', () => {
    const usersWithUndefined: User[] = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: undefined, createdAt: new Date() },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User', createdAt: new Date() }
    ];
    
    mockUserService.getUsers.and.returnValue(of(usersWithUndefined));
    fixture.detectChanges();

    component.sortUsers('role', 'asc');

    expect(component.users[0].name).toBe('Alice');

    component.sortUsers('role', 'desc');

    expect(component.users[0].name).toBe('Bob');
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();

    spyOn(component.destroy$, 'next');
    spyOn(component.destroy$, 'complete');
    
    component.ngOnDestroy();
    
    expect(component.destroy$.next).toHaveBeenCalled();
    expect(component.destroy$.complete).toHaveBeenCalled();
  });
});