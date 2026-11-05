'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// The signed-in customer's saved addresses (public.addresses; row-level
// security lets each customer manage only their own).

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Northern',
  'Volta', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Ahafo', 'Bono',
  'Bono East', 'North East', 'Savannah', 'Oti', 'Western North',
];

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  country: string;
  is_default: boolean;
}

const emptyForm = { full_name: '', phone: '', address_line1: '', city: '', state: '' };

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-700 focus:border-transparent';

export default function AddressBook() {
  const [userId, setUserId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (uid: string) => {
    const { data, error: loadError } = await supabase
      .from('addresses')
      .select('id, full_name, phone, address_line1, city, state, country, is_default')
      .eq('user_id', uid)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    if (loadError) setError('Could not load your addresses.');
    setAddresses(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      load(session.user.id);
    });
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({ full_name: a.full_name, phone: a.phone, address_line1: a.address_line1, city: a.city, state: a.state });
    setError('');
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!form.full_name.trim() || !form.phone.trim() || !form.address_line1.trim() || !form.city.trim() || !form.state) {
      setError('Please fill in every field.');
      return;
    }
    setSaving(true);
    setError('');
    const row = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      address_line1: form.address_line1.trim(),
      city: form.city.trim(),
      state: form.state,
      postal_code: '',
      country: 'Ghana',
    };
    const { error: saveError } = editingId
      ? await supabase.from('addresses').update(row).eq('id', editingId)
      : await supabase.from('addresses').insert([{ ...row, user_id: userId, is_default: addresses.length === 0 }]);
    setSaving(false);
    if (saveError) {
      setError('Could not save the address. Please try again.');
      return;
    }
    setShowForm(false);
    load(userId);
  };

  const remove = async (id: string) => {
    if (!userId || !confirm('Delete this address?')) return;
    const { error: delError } = await supabase.from('addresses').delete().eq('id', id);
    if (delError) setError('Could not delete the address.');
    load(userId);
  };

  const makeDefault = async (id: string) => {
    if (!userId) return;
    const { error: clearError } = await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    const { error: setErr } = clearError
      ? { error: clearError }
      : await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    if (setErr) setError('Could not change the default address.');
    load(userId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Address Book</h2>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          Add New Address
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      {showForm && (
        <div className="bg-white border-2 border-stone-900 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{editingId ? 'Edit Address' : 'New Address'}</h3>
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="addr-name" className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
              <input id="addr-name" type="text" className={inputCls} value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="addr-phone" className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
              <input id="addr-phone" type="tel" className={inputCls} value={form.phone} placeholder="024 XXX XXXX"
                onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="addr-street" className="block text-sm font-semibold text-gray-900 mb-2">Street Address</label>
              <input id="addr-street" type="text" className={inputCls} value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })} autoComplete="street-address" />
            </div>
            <div>
              <label htmlFor="addr-city" className="block text-sm font-semibold text-gray-900 mb-2">City / Town</label>
              <input id="addr-city" type="text" className={inputCls} value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} autoComplete="address-level2" />
            </div>
            <div>
              <label htmlFor="addr-region" className="block text-sm font-semibold text-gray-900 mb-2">Region</label>
              <select id="addr-region" className={inputCls} value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}>
                <option value="">Select region</option>
                {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="px-6 py-3 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Address'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading addresses…</p>
      ) : addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <i className="ri-map-pin-line text-4xl text-gray-400 mb-3 block"></i>
          <p className="text-gray-600">You have no saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={`bg-white border-2 rounded-lg p-6 ${a.is_default ? 'border-stone-900' : 'border-gray-200'}`}>
              {a.is_default && (
                <span className="inline-block px-3 py-1 bg-stone-100 text-stone-800 text-xs font-semibold rounded-full mb-3">Default</span>
              )}
              <p className="font-bold text-gray-900">{a.full_name}</p>
              <p className="text-gray-600 text-sm mt-1">{a.phone}</p>
              <p className="text-gray-600 text-sm mt-2">{a.address_line1}</p>
              <p className="text-gray-600 text-sm">{a.city}, {a.state}, {a.country}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm font-semibold">
                <button onClick={() => openEdit(a)} className="text-stone-800 hover:text-stone-950">Edit</button>
                {!a.is_default && (
                  <button onClick={() => makeDefault(a.id)} className="text-stone-800 hover:text-stone-950">Set as default</button>
                )}
                <button onClick={() => remove(a.id)} className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
