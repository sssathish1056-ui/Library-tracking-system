import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { IssueRecord, User } from '../types';
import { Button } from './Button';
import { Calendar, Book, CheckCircle } from 'lucide-react';

export const MyBooks: React.FC<{ user: User }> = ({ user }) => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const data = await db.getMyBooks(user.id);
      setIssues(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [user.id]);

  const handleReturn = async (issueId: number) => {
    if (!window.confirm('Return this book?')) return;
    try {
      await db.returnBook(issueId);
      fetchIssues();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your books...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Issued Books</h1>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {issues.map((issue) => (
            <li key={issue.issue_id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                      <Book className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-indigo-600 truncate">{issue.book_title}</p>
                      <p className="flex items-center text-sm text-gray-500">
                        by {issue.book_author}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${issue.return_date ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {issue.return_date ? 'Returned' : 'Borrowed'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      Issued: {new Date(issue.issue_date).toLocaleDateString()}
                    </p>
                    {issue.return_date && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <CheckCircle className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-400" />
                        Returned: {new Date(issue.return_date).toLocaleDateString()}
                        </p>
                    )}
                  </div>
                  {!issue.return_date && (
                     <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Button variant="secondary" onClick={() => handleReturn(issue.issue_id)} className="text-xs py-1 px-2 h-8">
                            Return Book
                        </Button>
                     </div>
                  )}
                </div>
              </div>
            </li>
          ))}
          {issues.length === 0 && (
              <li className="px-4 py-12 text-center text-gray-500">
                  You haven't borrowed any books yet. Check the inventory!
              </li>
          )}
        </ul>
      </div>
    </div>
  );
};