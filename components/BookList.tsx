import React, { useEffect, useState, useCallback } from 'react';
import { Book, Role, User } from '../types';
import { db } from '../services/db';
import { Button } from './Button';
import { Search, Plus, Trash2, Edit2, BookOpen, Book as BookIcon } from 'lucide-react';

interface BookListProps {
  user: User;
}

export const BookList: React.FC<BookListProps> = ({ user }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null); // book_id being acted upon
  const [error, setError] = useState('');
  
  // Form State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({ title: '', author: '', quantity: 1 });

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.getAllBooks();
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleIssue = async (book: Book) => {
    if (!window.confirm(`Confirm issue of "${book.title}"?`)) return;
    setActionLoading(book.book_id);
    setError('');
    try {
      await db.issueBook(user.id, book.book_id);
      await fetchBooks();
      alert('Book issued successfully!');
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (bookId: number) => {
    if (!window.confirm('Are you sure you want to delete this book? This cannot be undone.')) return;
    setActionLoading(bookId);
    try {
      await db.deleteBook(bookId);
      await fetchBooks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({ title: book.title, author: book.author, quantity: book.quantity });
    } else {
      setEditingBook(null);
      setFormData({ title: '', author: '', quantity: 1 });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await db.updateBook(editingBook.book_id, formData);
      } else {
        await db.addBook(formData);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Library Inventory</h1>
        {user.role === Role.ADMIN && (
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Book
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Books Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading library catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <div key={book.book_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="bg-indigo-50 p-2 rounded-lg">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${book.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {book.available > 0 ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 leading-tight">{book.title}</h3>
                <p className="text-gray-500 text-sm mt-1">by {book.author}</p>
                
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Stock:</span>
                  {book.available} / {book.quantity}
                </div>

                <div className="mt-6 pt-4 border-t flex gap-2">
                  {user.role === Role.ADMIN ? (
                    <>
                      <button 
                        onClick={() => openModal(book)}
                        className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center justify-center transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(book.book_id)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center justify-center transition-colors"
                        disabled={actionLoading === book.book_id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </button>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      disabled={book.available === 0 || actionLoading === book.book_id}
                      onClick={() => handleIssue(book)}
                      isLoading={actionLoading === book.book_id}
                    >
                      {book.available === 0 ? 'Unavailable' : 'Issue Book'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredBooks.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <BookIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleFormSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingBook ? 'Edit Book' : 'Add New Book'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Author</label>
                      <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Quantity</label>
                      <input required type="number" min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="secondary" className="mt-3 sm:mt-0 sm:mr-3" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};