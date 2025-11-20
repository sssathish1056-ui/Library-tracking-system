import { User, Book, IssueRecord, Role } from '../types';

const KEYS = {
  USERS: 'libtrack_users',
  BOOKS: 'libtrack_books',
  ISSUES: 'libtrack_issues',
  SESSION: 'libtrack_session'
};

// Seed Data
const SEED_USERS: User[] = [
  { id: 1, username: 'admin', password: 'admin123', role: Role.ADMIN, fullName: 'Chief Librarian' },
  { id: 2, username: 'student', password: 'user123', role: Role.USER, fullName: 'John Doe' },
];

const SEED_BOOKS: Book[] = [
  { book_id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', quantity: 5, available: 5 },
  { book_id: 2, title: 'Clean Code', author: 'Robert C. Martin', quantity: 3, available: 2 },
  { book_id: 3, title: 'The Pragmatic Programmer', author: 'Andy Hunt', quantity: 4, available: 4 },
  { book_id: 4, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', quantity: 2, available: 0 },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDB {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(KEYS.BOOKS)) {
      localStorage.setItem(KEYS.BOOKS, JSON.stringify(SEED_BOOKS));
    }
    if (!localStorage.getItem(KEYS.ISSUES)) {
      localStorage.setItem(KEYS.ISSUES, JSON.stringify([]));
    }
  }

  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  private getBooks(): Book[] {
    return JSON.parse(localStorage.getItem(KEYS.BOOKS) || '[]');
  }

  private getIssues(): IssueRecord[] {
    return JSON.parse(localStorage.getItem(KEYS.ISSUES) || '[]');
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  private saveBooks(books: Book[]) {
    localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  }

  private saveIssues(issues: IssueRecord[]) {
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(issues));
  }

  // --- AUTH ---
  async login(username: string, password: string): Promise<User> {
    await delay(500);
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    const { password: _, ...safeUser } = user;
    return safeUser as User;
  }

  async register(username: string, password: string, fullName: string): Promise<User> {
    await delay(500);
    const users = this.getUsers();
    if (users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    const newUser: User = {
      id: Date.now(),
      username,
      password, // In real app, hash this
      fullName,
      role: Role.USER
    };
    users.push(newUser);
    this.saveUsers(users);
    const { password: _, ...safeUser } = newUser;
    return safeUser as User;
  }

  // --- BOOKS ---
  async getAllBooks(): Promise<Book[]> {
    await delay(300);
    return this.getBooks();
  }

  async addBook(book: Omit<Book, 'book_id' | 'available'>): Promise<Book> {
    await delay(400);
    const books = this.getBooks();
    const newBook: Book = {
      ...book,
      book_id: Date.now(),
      available: book.quantity
    };
    books.push(newBook);
    this.saveBooks(books);
    return newBook;
  }

  async updateBook(bookId: number, updates: Partial<Book>): Promise<Book> {
    await delay(400);
    const books = this.getBooks();
    const index = books.findIndex(b => b.book_id === bookId);
    if (index === -1) throw new Error('Book not found');
    
    // Adjust availability if quantity changes
    const oldBook = books[index];
    let newAvailable = oldBook.available;
    if (updates.quantity !== undefined) {
      const diff = updates.quantity - oldBook.quantity;
      newAvailable = oldBook.available + diff;
      if (newAvailable < 0) throw new Error('Cannot reduce quantity below currently issued amount');
    }

    const updatedBook = { ...oldBook, ...updates, available: newAvailable };
    books[index] = updatedBook;
    this.saveBooks(books);
    return updatedBook;
  }

  async deleteBook(bookId: number): Promise<void> {
    await delay(400);
    const books = this.getBooks();
    // Check if book is currently issued
    const issues = this.getIssues();
    const hasActiveIssue = issues.some(i => i.book_id === bookId && i.return_date === null);
    if (hasActiveIssue) throw new Error('Cannot delete book while copies are issued.');

    const filtered = books.filter(b => b.book_id !== bookId);
    this.saveBooks(filtered);
  }

  // --- ISSUES ---
  async issueBook(userId: number, bookId: number): Promise<IssueRecord> {
    await delay(500);
    const books = this.getBooks();
    const bookIndex = books.findIndex(b => b.book_id === bookId);
    if (bookIndex === -1) throw new Error('Book not found');
    
    if (books[bookIndex].available <= 0) throw new Error('No copies available');

    const issues = this.getIssues();
    
    // Check if user already has this book
    const alreadyHas = issues.some(i => i.user_id === userId && i.book_id === bookId && i.return_date === null);
    if (alreadyHas) throw new Error('User already has a copy of this book');

    const newIssue: IssueRecord = {
      issue_id: Date.now(),
      user_id: userId,
      book_id: bookId,
      issue_date: new Date().toISOString(),
      return_date: null
    };

    issues.push(newIssue);
    books[bookIndex].available -= 1;

    this.saveIssues(issues);
    this.saveBooks(books);
    return newIssue;
  }

  async returnBook(issueId: number): Promise<void> {
    await delay(500);
    const issues = this.getIssues();
    const issueIndex = issues.findIndex(i => i.issue_id === issueId);
    if (issueIndex === -1) throw new Error('Issue record not found');
    
    if (issues[issueIndex].return_date !== null) throw new Error('Book already returned');

    const books = this.getBooks();
    const bookIndex = books.findIndex(b => b.book_id === issues[issueIndex].book_id);
    
    issues[issueIndex].return_date = new Date().toISOString();
    if (bookIndex !== -1) {
      books[bookIndex].available += 1;
    }

    this.saveIssues(issues);
    this.saveBooks(books);
  }

  async getMyBooks(userId: number): Promise<IssueRecord[]> {
    await delay(300);
    const issues = this.getIssues();
    const books = this.getBooks();
    
    return issues
      .filter(i => i.user_id === userId)
      .map(i => {
        const book = books.find(b => b.book_id === i.book_id);
        return {
          ...i,
          book_title: book?.title || 'Unknown',
          book_author: book?.author || 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  }

  async getAllIssues(): Promise<IssueRecord[]> {
     await delay(300);
     const issues = this.getIssues();
     const books = this.getBooks();
     const users = this.getUsers();

     return issues.map(i => {
       const book = books.find(b => b.book_id === i.book_id);
       const user = users.find(u => u.id === i.user_id);
       return {
         ...i,
         book_title: book?.title || 'Deleted Book',
         book_author: book?.author || 'Unknown',
         username: user?.username || 'Unknown'
       };
     }).sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  }
}

export const db = new MockDB();