export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: string;
  displayName: string;
}

export interface SortState {
  field: string;
  direction: SortDirection;
}