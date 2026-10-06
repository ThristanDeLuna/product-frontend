import { useEffect, useState } from 'react';
import { listProducts, createProduct, updateProduct, deleteProduct, errorMessage } from '../api';

const empty = { product_name: '', description: '', price: '', quantity: '' };

export default function Products({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setProducts(await listProducts());
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const reset = () => { setForm(empty); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      product_name: form.product_name,
      description: form.description,
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    try {
      if (editingId) await updateProduct(editingId, payload);
      else await createProduct(payload);
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({ product_name: p.product_name, description: p.description || '', price: p.price, quantity: p.quantity });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    try {
      await deleteProduct(p.id);
      if (editingId === p.id) reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="container">
      <header className="topbar">
        <h1>Products</h1>
        <div className="topbar-right">
          <span className="muted">Signed in as <strong>{user.username}</strong></span>
          <button className="btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <form className="card form-grid" onSubmit={submit}>
        <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
        <label>Name
          <input value={form.product_name} onChange={set('product_name')} required maxLength={100} />
        </label>
        <label>Price
          <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required />
        </label>
        <label>Quantity
          <input type="number" step="1" min="0" value={form.quantity} onChange={set('quantity')} required />
        </label>
        <label className="span-all">Description
          <textarea rows={2} value={form.description} onChange={set('description')} />
        </label>
        <div className="span-all actions">
          <button className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add product'}
          </button>
          {editingId && <button type="button" className="btn" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="card table-wrap">
        {loading ? (
          <p className="muted pad">Loading…</p>
        ) : products.length === 0 ? (
          <p className="muted pad">No products yet. Add your first one above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Description</th><th className="num">Price</th><th className="num">Qty</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.product_name}</td>
                  <td className="desc">{p.description}</td>
                  <td className="num">{p.price.toFixed(2)}</td>
                  <td className="num">{p.quantity}</td>
                  <td className="row-actions">
                    <button className="btn small" onClick={() => edit(p)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
