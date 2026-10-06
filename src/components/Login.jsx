import { useState } from 'react';
import { login, register, storage, errorMessage } from '../api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(form.username, form.email, form.password);
        setNotice('Account created. You can log in now.');
        setMode('login');
      } else {
        const data = await login(form.username, form.password);
        storage.save(data.tokens, data.user);
        onLogin(data.user);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="muted">Product Management System</p>

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert ok">{notice}</div>}

        <label>Username
          <input value={form.username} onChange={set('username')} required minLength={3} autoFocus />
        </label>
        {mode === 'register' && (
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
        )}
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
        </label>

        <button className="btn primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
        </button>

        <button
          type="button"
          className="link"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}
        >
          {mode === 'login' ? "No account? Register" : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
