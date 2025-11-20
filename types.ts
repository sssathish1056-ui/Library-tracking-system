export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: number;
  username: string;
  password?: string; // In a real app, this is hashed. Here stored for mock auth.
  role: Role;
  fullName: string;
}

export interface Book {
  book_id: number;
  title: string;
  author: string;
  quantity: number;
  available: number;
}

export interface IssueRecord {
  issue_id: number;
  user_id: number;
  book_id: number;
  issue_date: string; // ISO Date string
  return_date: string | null; // ISO Date string or null if not returned
  // Joined data for UI convenience
  book_title?: string;
  book_author?: string;
  username?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}