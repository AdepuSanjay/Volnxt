import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Activity, AlertTriangle, ArrowDownToLine, BatteryCharging, Bell, Bike,
  Building2, Check, ChevronDown, CircleDollarSign, ClipboardList, CreditCard,
  Gauge, LayoutDashboard, LogOut, MessageSquareText, RefreshCw, Search,
  ShieldCheck, Star, Users, X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const sections = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Riders & users', icon: Users },
  { key: 'providers', label: 'Providers', icon: Building2 },
  { key: 'requests', label: 'Charging requests', icon: ClipboardList },
  { key: 'sessions', label: 'Sessions', icon: BatteryCharging },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { key: 'ratings', label: 'Ratings', icon: Star },
  { key: 'reservations', label: 'Reservations', icon: Activity },
  { key: 'vehicles', label: 'Vehicles', icon: Bike },
  { key: 'notifications', label: 'Notifications', icon: Bell }
];

const columns = {
  users: [['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['role', 'Role'], ['isActive', 'Account'], ['createdAt', 'Joined']],
  providers: [['userId.name', 'Provider'], ['businessName', 'Business'], ['address', 'Location'], ['providerType', 'Type'], ['verificationStatus', 'Verification'], ['price', 'Price']],
  requests: [['riderId.name', 'Rider'], ['providerId.name', 'Provider'], ['status', 'Status'], ['estimatedPrice', 'Estimate'], ['createdAt', 'Created']],
  sessions: [['riderId.name', 'Rider'], ['providerId.name', 'Provider'], ['status', 'Status'], ['finalAmount', 'Amount'], ['energyDeliveredKwh', 'Energy'], ['createdAt', 'Started']],
  payments: [['riderId.name', 'Rider'], ['providerId.name', 'Provider'], ['grossAmount', 'Gross'], ['platformFee', 'Platform fee'], ['status', 'Status'], ['createdAt', 'Date']],
  disputes: [['reason', 'Reason'], ['riderId.name', 'Rider'], ['providerId.name', 'Provider'], ['expectedAmount', 'Expected'], ['chargedAmount', 'Charged'], ['status', 'Status']],
  ratings: [['fromUserId.name', 'From'], ['toUserId.name', 'To'], ['rating', 'Rating'], ['review', 'Review'], ['createdAt', 'Date']],
  reservations: [['riderId.name', 'Rider'], ['providerId.name', 'Provider'], ['status', 'Status'], ['expiresAt', 'Expires']],
  vehicles: [['userId.name', 'Owner'], ['brand', 'Brand'], ['vehicleModel', 'Model'], ['registrationNumber', 'Registration'], ['connectorType', 'Connector']],
  notifications: [['userId.name', 'Recipient'], ['title', 'Title'], ['message', 'Message'], ['isRead', 'Read'], ['createdAt', 'Created']]
};

const statusOptions = {
  providers: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
  requests: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'CHARGING', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
  sessions: ['IN_PROGRESS', 'CHARGING', 'COMPLETED', 'DISPUTED'],
  payments: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'DISPUTED'],
  disputes: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
  reservations: ['ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED']
};

const getValue = (record, path) => path.split('.').reduce((value, key) => value?.[key], record);

const formatValue = (value, key) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'createdAt' || key === 'expiresAt') return new Date(value).toLocaleString();
  if (['price', 'estimatedPrice', 'finalAmount', 'grossAmount', 'platformFee', 'expectedAmount', 'chargedAmount'].includes(key)) {
    return `₹${Number(value).toLocaleString()}`;
  }
  if (key === 'energyDeliveredKwh') return `${value} kWh`;
  return String(value);
};

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [section, setSection] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const api = useCallback(() => axios.create({
    baseURL: `${API_BASE_URL}/api/admin`,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  const fetchSummary = useCallback(async () => {
    const response = await api().get('/summary');
    setSummary(response.data);
  }, [api]);

  const fetchItems = useCallback(async (module) => {
    if (module === 'overview') return;
    const response = await api().get(`/${module}`);
    setItems(response.data.items || []);
  }, [api]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await fetchSummary();
      await fetchItems(section);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load admin data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchItems, fetchSummary, section]);

  useEffect(() => { refresh(); }, [refresh]);

  const selectSection = (nextSection) => {
    setSection(nextSection);
    setQuery('');
    setNotice('');
  };

  const updateRecord = async (item, value, isActive = false) => {
    setUpdatingId(item._id);
    setError('');
    setNotice('');
    try {
      await api().patch(`/${section}/${item._id}`, isActive ? { isActive: value } : { status: value });
      setItems((current) => current.map((record) => record._id === item._id
        ? (isActive ? { ...record, isActive: value } : section === 'providers' ? { ...record, verificationStatus: value } : { ...record, status: value })
        : record));
      setNotice('Changes saved.');
      await fetchSummary();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this change.');
    } finally {
      setUpdatingId('');
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(normalizedQuery));
  }, [items, query]);

  const activeSection = sections.find((item) => item.key === section);
  const stats = summary ? [
    { label: 'Riders', value: summary.riders, detail: 'Registered accounts', icon: Users, tone: 'text-cyan-700 bg-cyan-50' },
    { label: 'Providers', value: summary.providers, detail: `${summary.pendingProviders} awaiting review`, icon: Building2, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Live sessions', value: summary.activeSessions, detail: `${summary.requests} requests recorded`, icon: Gauge, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Paid volume', value: `₹${Number(summary.paidGross).toLocaleString()}`, detail: `₹${Number(summary.platformFees).toLocaleString()} platform fees`, icon: CircleDollarSign, tone: 'text-rose-700 bg-rose-50' },
    { label: 'Open disputes', value: summary.openDisputes, detail: `${summary.ratings} ratings submitted`, icon: ShieldCheck, tone: 'text-indigo-700 bg-indigo-50' }
  ] : [];

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white"><BatteryCharging size={19} /></div>
            <div className="text-lg font-black tracking-tight">VOLNXT <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Control</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-bold">{user?.name || 'Administrator'}</p><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Platform admin</p></div>
            <button type="button" onClick={logout} title="Log out" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-3 py-3 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <p className="hidden px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 lg:block">Workspace</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin sections">
            {sections.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => selectSection(key)} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition lg:w-full ${section === key ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon size={17} strokeWidth={2} /><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 hidden rounded-lg border border-emerald-100 bg-[#f3faf5] p-4 lg:block">
            <div className="mb-2 flex items-center gap-2 text-emerald-800"><ShieldCheck size={16} /><span className="text-xs font-bold">Admin access</span></div>
            <p className="text-xs leading-5 text-slate-600">Account status and operational records are managed from this workspace.</p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">Administration</p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{activeSection?.label}</h1>
              <p className="mt-1 text-sm text-slate-500">Monitor the VOLNXT network and manage platform records.</p>
            </div>
            <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {error && <div role="alert" className="mb-5 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"><X size={17} />{error}</div>}
          {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><Check size={17} />{notice}</div>}

          {section === 'overview' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {stats.map(({ label, value, detail, icon: Icon, tone }) => (
                  <div key={label} className="min-w-0 border-y border-slate-200 bg-white p-4 first:rounded-l-lg last:rounded-r-lg sm:rounded-lg sm:border">
                    <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon size={17} /></span></div>
                    <div className="mt-4 truncate text-2xl font-black tracking-tight">{value ?? '—'}</div>
                    <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
                  </div>
                ))}
              </div>
              <section className="mt-8 border-t border-slate-200 pt-6">
                <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-base font-extrabold">Operational modules</h2><p className="mt-1 text-sm text-slate-500">Jump directly to a platform area.</p></div></div>
                <div className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
                  {sections.filter(({ key }) => key !== 'overview').map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => selectSection(key)} className="flex items-center justify-between border-b border-slate-200 py-4 text-left transition hover:text-emerald-800">
                      <span className="flex items-center gap-3"><Icon className="text-emerald-700" size={18} /><span className="text-sm font-bold">{label}</span></span><ChevronDown className="-rotate-90 text-slate-400" size={16} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                <div><h2 className="font-extrabold">{activeSection?.label}</h2><p className="mt-1 text-xs text-slate-500">{filteredItems.length} records shown, up to 250 most recent.</p></div>
                <label className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 sm:w-72">
                  <Search size={16} className="shrink-0 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                  <thead><tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500">{(columns[section] || []).map(([path, label]) => <th key={path} className="whitespace-nowrap px-4 py-3">{label}</th>)}{(statusOptions[section] || section === 'users') && <th className="whitespace-nowrap px-4 py-3">Manage</th>}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? <tr><td colSpan={(columns[section] || []).length + 1} className="px-4 py-12 text-center text-slate-500">Loading records…</td></tr> : filteredItems.length === 0 ? <tr><td colSpan={(columns[section] || []).length + 1} className="px-4 py-12 text-center text-slate-500">No matching records.</td></tr> : filteredItems.map((item) => (
                      <tr key={item._id} className="transition hover:bg-slate-50/80">
                        {(columns[section] || []).map(([path]) => {
                          const value = getValue(item, path);
                          const isStatus = ['status', 'verificationStatus'].includes(path);
                          const isBoolean = typeof value === 'boolean';
                          return <td key={path} className="max-w-[260px] px-4 py-3.5 align-middle text-slate-700"><span className={`${isStatus ? 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-700' : ''} ${path === 'name' || path.endsWith('.name') ? 'font-bold text-slate-900' : ''}`}>{isBoolean ? <span className={`font-semibold ${value ? 'text-emerald-700' : 'text-slate-500'}`}>{formatValue(value, path)}</span> : <span className="block truncate" title={formatValue(value, path.split('.').pop())}>{formatValue(value, path.split('.').pop())}</span>}</span></td>;
                        })}
                        {(statusOptions[section] || section === 'users') && <td className="whitespace-nowrap px-4 py-3.5">
                          {section === 'users' ? <button type="button" disabled={updatingId === item._id || item._id === user?._id} onClick={() => updateRecord(item, !item.isActive, true)} title={item._id === user?._id ? 'Your account cannot be changed here' : 'Toggle account access'} className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${item.isActive ? 'bg-emerald-50 text-emerald-800 hover:bg-rose-50 hover:text-rose-800' : 'bg-rose-50 text-rose-800 hover:bg-emerald-50 hover:text-emerald-800'}`}>{updatingId === item._id ? 'Saving…' : item.isActive ? 'Deactivate' : 'Activate'}</button> : statusOptions[section] ? <select aria-label={`Update status for ${item._id}`} disabled={updatingId === item._id} value={section === 'providers' ? item.verificationStatus : item.status} onChange={(event) => updateRecord(item, event.target.value)} className="max-w-[170px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600">{statusOptions[section].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select> : <span className="text-xs text-slate-400">Read only</span>}
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500"><span>History and financial records are retained for audit.</span><span>{items.length} loaded</span></div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
