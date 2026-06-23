'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Ticket, Users, TrendingUp, Search, Bell, Settings, ArrowLeft, MoreVertical, Check, Save, Lock, KeyRound, CalendarDays } from "lucide-react";
import Link from 'next/link';
import { useUser } from "@clerk/nextjs"; 

export default function AdminCRM() {
  const { user, isLoaded } = useUser();
  
  // --- States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'visitors' | 'forecast' | 'settings'>('dashboard');
  const [stats, setStats] = useState({ total_bookings: 0, total_revenue: 0, total_visitors: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Security & Settings ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [prices, setPrices] = useState<any>({ adult_price: 500, child_price: 250, show_price: 300 });
  const [newPassword, setNewPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // --- Forecast State ---
  const [forecastDate, setForecastDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // Default: Tomorrow's date
  });
  const [forecastData, setForecastData] = useState({ expected_visitors: 0, expected_revenue: 0 });

  const ADMIN_EMAILS = ["mohammedibrahimshaikh833@gmail.com"]; 
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // --- Initial Fetch ---
  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin || !isUnlocked) { setLoading(false); return; }

    const fetchAdminData = async () => {
      try {
        const statsRes = await fetch('http://127.0.0.1:8001/api/admin/stats');
        if (statsRes.ok) setStats(await statsRes.json());

        const bookingsRes = await fetch('http://127.0.0.1:8001/api/admin/bookings');
        if (bookingsRes.ok) setBookings(await bookingsRes.json());

        const visitorsRes = await fetch('http://127.0.0.1:8001/api/admin/visitors');
        if (visitorsRes.ok) setVisitors(await visitorsRes.json());

        const settingsRes = await fetch('http://127.0.0.1:8001/api/admin/settings');
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setPrices({ adult_price: s.adult_price, child_price: s.child_price, show_price: s.show_price });
        }
      } catch (error) { console.error("Data error", error); } 
      finally { setLoading(false); }
    };
    fetchAdminData();
  }, [isLoaded, userEmail, isAdmin, isUnlocked]);

  // --- Fetch Forecast whenever date changes ---
  useEffect(() => {
    if(!isUnlocked) return;
    const fetchForecast = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8001/api/admin/daily-visitors?date=${forecastDate}`);
        if(res.ok) setForecastData(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchForecast();
  }, [forecastDate, isUnlocked]);

  // --- Handlers ---
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('Verifying...');
    try {
      const res = await fetch('http://127.0.0.1:8001/api/admin/verify-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: passInput })
      });
      if (!res.ok) { setPassError(`Server Error! Code: ${res.status}`); return; }
      const data = await res.json();
      if (data.success) { setIsUnlocked(true); setLoading(true); } 
      else { setPassError('❌ Incorrect Passcode.'); }
    } catch (err) { setPassError('🚨 Server dead! Check terminal.'); }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('Saving...');
    try {
      // 🚨 FIX: Yahan parseInt() ya Number() use karna zaroori hai
      const payload: any = { 
        adult_price: parseInt(prices.adult_price.toString()), 
        child_price: parseInt(prices.child_price.toString()), 
        show_price: parseInt(prices.show_price.toString()) 
      };
      
      if (newPassword.trim() !== '') {
        payload.admin_password = newPassword;
      }

      const res = await fetch('http://127.0.0.1:8001/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSaveStatus('✅ Saved Successfully!');
        setNewPassword(''); // Clear password field
        
        // Refresh local stats after saving
        const statsRes = await fetch('http://127.0.0.1:8001/api/admin/stats');
        if (statsRes.ok) setStats(await statsRes.json());
        
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Save Failed!');
      }
    } catch (error) {
      setSaveStatus('🚨 Network Error!');
    }
  };

  const filteredBookings = bookings.filter(b => b.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toString().includes(searchTerm));
  const filteredVisitors = visitors.filter(v => v.email?.toLowerCase().includes(searchTerm.toLowerCase()) || (v.name && v.name.toLowerCase().includes(searchTerm.toLowerCase())));

  // --- Screens ---
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Lock size={48} className="text-rose-500 mb-4" />
        <h1 className="text-4xl font-black mb-2 tracking-tight">Access Denied</h1>
        <Link href="/" className="px-8 py-3 bg-white text-slate-900 rounded-full font-black text-sm uppercase mt-4">Return</Link>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white selection:bg-emerald-500/30">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400"><KeyRound size={32} /></div>
          <h2 className="text-2xl font-black mb-2">HQ Locked</h2>
          <form onSubmit={handleUnlock}>
            <input type="password" placeholder="Passcode..." value={passInput} onChange={(e) => setPassInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 mb-4" autoFocus />
            {passError && <p className="text-rose-400 text-xs font-bold mb-4 animate-pulse">{passError}</p>}
            <button type="submit" className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-600">Unlock Terminal</button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-emerald-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800"><h1 className="text-xl font-black tracking-tight">Aetherium <span className="text-emerald-500">HQ</span></h1></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Dashboard</button>
          {/* NAYA FORECAST BUTTON IN SIDEBAR */}
          <button onClick={() => setActiveTab('forecast')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'forecast' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><CalendarDays size={18} /> Forecast</button>
          <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'bookings' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Ticket size={18} /> All Bookings</button>
          <button onClick={() => setActiveTab('visitors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'visitors' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Users size={18} /> Visitors</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Settings size={18} /> Settings</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"><ArrowLeft size={14} /> Back to Website</Link></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={`Search...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-emerald-500 transition-all"/>
          </div>
          <div className="px-4 py-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full font-black text-xs uppercase tracking-widest">Admin Mode</div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-black text-slate-800 mb-6">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {/* Paid Revenue Note Added */}
                  <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4"><div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><TrendingUp size={24} /></div><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Paid Revenue</p><h3 className="text-2xl font-black text-slate-800">₹{stats.total_revenue.toLocaleString()}</h3></div></div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4"><div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Ticket size={24} /></div><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Bookings</p><h3 className="text-2xl font-black text-slate-800">{stats.total_bookings}</h3></div></div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4"><div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0"><Users size={24} /></div><div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Registered Users</p><h3 className="text-2xl font-black text-slate-800">{stats.total_visitors}</h3></div></div>
                </div>
              </motion.div>
            )}

            {/* --- NAYA TAB: FORECAST --- */}
            {activeTab === 'forecast' && (
              <motion.div key="forecast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-8 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Visitor Forecast</h2>
                    <p className="text-sm text-slate-500 font-medium">Predict expected footfall based on paid tickets.</p>
                  </div>
                  <div>
                    <input 
                      type="date" 
                      value={forecastDate} 
                      onChange={(e) => setForecastDate(e.target.value)} 
                      className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10"><Users size={180} /></div>
                    <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-80">Expected Visitors</p>
                    <h1 className="text-6xl font-black mb-4">{forecastData.expected_visitors}</h1>
                    <p className="text-sm font-medium opacity-90">Confirmed paid tickets for {new Date(forecastDate).toDateString()}</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                     <div className="absolute -right-10 -top-10 text-slate-100"><TrendingUp size={180} /></div>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expected Revenue</p>
                     <h1 className="text-5xl font-black text-slate-800 mb-4">₹{forecastData.expected_revenue.toLocaleString()}</h1>
                     <p className="text-sm text-emerald-600 font-bold">From confirmed bookings</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 <h2 className="text-2xl font-black text-slate-800 mb-6">All Bookings</h2>
                 <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-xs font-black text-slate-400 uppercase">
                       <tr><th className="p-4 pl-6">ID</th><th className="p-4">Customer</th><th className="p-4">Visit Date</th><th className="p-4">Status</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {filteredBookings.map(b => (
                         <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4 pl-6 font-bold text-slate-800">AETH-{b.id}</td>
                           <td className="p-4 text-slate-600">{b.customer_email}</td>
                           <td className="p-4 text-slate-600 font-medium">{b.visit_date ? new Date(b.visit_date).toLocaleDateString() : 'Not Set'}</td>
                           <td className="p-4">
                             {b.payment_status ? <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Paid</span> 
                                               : <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </motion.div>
            )}

            {activeTab === 'visitors' && (
              <motion.div key="visitors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-black text-slate-800 mb-6">Museum Visitors</h2>
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                        <tr><th className="p-4 pl-6">User ID</th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredVisitors.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800">USR-{v.id}</td>
                            <td className="p-4 text-slate-800 font-bold">{v.name || 'Not Provided'}</td>
                            <td className="p-4 text-slate-600">{v.email}</td>
                            <td className="p-4 text-slate-500">{v.phone_number || 'Not Provided'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- TAB 5: SETTINGS (ZERO BUG FIXED) --- */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-8 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-800">System Settings</h2>
                  {saveStatus && <span className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full text-sm animate-pulse">{saveStatus}</span>}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Ticket size={20} className="text-emerald-500"/> Dynamic Pricing</h3>
                    <div className="space-y-4">
                      {/* ZERO BUG FIX: value='' allowed, handled in onChange */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Adult Pass (₹)</label>
                        <input type="number" value={prices.adult_price === '' ? '' : prices.adult_price} onChange={(e) => setPrices({...prices, adult_price: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Child Pass (₹)</label>
                        <input type="number" value={prices.child_price === '' ? '' : prices.child_price} onChange={(e) => setPrices({...prices, child_price: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">3D Space Show (₹)</label>
                        <input type="number" value={prices.show_price === '' ? '' : prices.show_price} onChange={(e) => setPrices({...prices, show_price: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Lock size={20} className="text-rose-500"/> Passcode Update</h3>
                      <input type="password" placeholder="New Passcode..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder-slate-400" />
                    </div>
                    <button onClick={handleSaveSettings} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                      <Save size={18} /> Deploy Settings
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}