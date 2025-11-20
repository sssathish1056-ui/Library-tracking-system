import React, { useState } from 'react';
import { Book, LogOut, User, Menu, X, LayoutDashboard, Library } from 'lucide-react';
import { Role, User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType | null;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onChangeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        currentView === view 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
          <Library className="w-6 h-6" />
          <span>LibTrack Pro</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b bg-indigo-600">
             <div className="flex items-center space-x-2 text-white font-bold text-xl">
              <Library className="w-6 h-6" />
              <span>LibTrack Pro</span>
            </div>
          </div>

          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {user && (
              <div className="mb-8 px-4 py-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600 uppercase font-semibold tracking-wider">Logged in as</p>
                <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                  {user.role === Role.ADMIN ? 'Administrator' : 'Student'}
                </span>
              </div>
            )}

            {user?.role === Role.ADMIN && (
              <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            )}
            <NavItem view="books" icon={Book} label="Book Inventory" />
            
            {user?.role === Role.USER && (
               <NavItem view="my-books" icon={User} label="My Issued Books" />
            )}
          </div>

          <div className="p-4 border-t">
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};