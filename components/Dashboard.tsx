import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Book, IssueRecord, User } from '../types';
import { BookOpen, Users, AlertCircle, CheckCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    issuedBooks: 0,
    totalUsers: 0
  });
  const [recentIssues, setRecentIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const books = await db.getAllBooks();
        // Note: In a real app, we wouldn't fetch ALL users/issues, just counts, but for mock DB this is fine
        // Users are private in MockDB class so we estimate or add a method. 
        // I will just mock the user count logic here based on the public issue records for simplicity
        // or rely on what we can access. Let's stick to book stats which are robust.
        const issues = await db.getAllIssues();

        const totalBooks = books.reduce((acc, b) => acc + b.quantity, 0);
        const available = books.reduce((acc, b) => acc + b.available, 0);
        const issued = totalBooks - available;

        setStats({
          totalBooks,
          issuedBooks: issued,
          totalUsers: new Set(issues.map(i => i.user_id)).size // Unique active users
        });

        setRecentIssues(issues.slice(0, 5)); // Top 5 recent
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleReturn = async (issueId: number) => {
    if(!window.confirm("Confirm return of this book?")) return;
    try {
        await db.returnBook(issueId);
        // Reload simple
        window.location.reload(); // Lazy reload for dashboard state update in this simple demo
    } catch (e: any) {
        alert(e.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard title="Total Books in Library" value={stats.totalBooks} icon={BookOpen} color="bg-blue-500" />
        <StatCard title="Currently Issued" value={stats.issuedBooks} icon={AlertCircle} color="bg-amber-500" />
        <StatCard title="Active Borrowers" value={stats.totalUsers} icon={Users} color="bg-green-500" />
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentIssues.map((issue) => (
                <tr key={issue.issue_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{issue.book_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(issue.issue_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${issue.return_date ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {issue.return_date ? 'Returned' : 'Issued'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     {!issue.return_date && (
                         <button onClick={() => handleReturn(issue.issue_id)} className="text-indigo-600 hover:text-indigo-900">Mark Returned</button>
                     )}
                  </td>
                </tr>
              ))}
              {recentIssues.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No transactions found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};