import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { LoginForm, RegisterForm } from './components/AuthForms';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BookList } from './components/BookList';
import { MyBooks } from './components/MyBooks';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('login'); // login, register, dashboard, books, my-books

  // Check for session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('libtrack_active_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setView(parsedUser.role === Role.ADMIN ? 'dashboard' : 'books');
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('libtrack_active_user', JSON.stringify(loggedInUser));
    setView(loggedInUser.role === Role.ADMIN ? 'dashboard' : 'books');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('libtrack_active_user');
    setView('login');
  };

  // Render Auth Pages
  if (!user) {
    if (view === 'register') {
      return <RegisterForm onLogin={handleLogin} onToggleMode={() => setView('login')} />;
    }
    return <LoginForm onLogin={handleLogin} onToggleMode={() => setView('register')} />;
  }

  // Render App Layout
  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentView={view} 
      onChangeView={setView}
    >
      {view === 'dashboard' && user.role === Role.ADMIN && <Dashboard />}
      {view === 'books' && <BookList user={user} />}
      {view === 'my-books' && user.role === Role.USER && <MyBooks user={user} />}
      
      {/* Fallbacks/Redirects for unauthorized routes */}
      {view === 'dashboard' && user.role !== Role.ADMIN && (
        <div className="text-center p-10">Unauthorized Access</div>
      )}
    </Layout>
  );
}

export default App;