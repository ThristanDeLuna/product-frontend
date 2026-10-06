import { useEffect, useState } from 'react';
import { storage, logout } from './api';
import Login from './components/Login.jsx';
import Products from './components/Products.jsx';

export default function App() {
  const [user, setUser] = useState(storage.access ? storage.user || { username: 'user' } : null);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const handleLogout = async () => {
    await logout();
    storage.clear();
    setUser(null);
  };

  return user ? (
    <Products user={user} onLogout={handleLogout} />
  ) : (
    <Login onLogin={setUser} />
  );
}
