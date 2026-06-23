'use client';

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, ArrowLeft, QrCode, ShieldCheck, Sparkles, ShoppingBag, Loader2, CheckCircle2, CreditCard, X, Smartphone, Building, Printer, Download, Tag } from "lucide-react";
import Link from "next/link";

export default function UserDashboard() {
  const { user, isLoaded } = useUser();
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // --- Modal & Interactive States ---
  const [selectedTicket, setSelectedTicket] = useState<any>(null); // For Payment
  const [receiptTicket, setReceiptTicket] = useState<any>(null);   // For Receipt
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'bank'>('upi');
  
  // REWARD STATE
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // --- 1. Persist Reward State on Load ---
  useEffect(() => {
    // Check if reward was already claimed in this browser
    const savedReward = localStorage.getItem('aetherium_reward_claimed');
    if (savedReward === 'true') {
      setRewardClaimed(true);
    }
  }, []);

  // Handle claiming reward
  const handleClaimReward = () => {
    setRewardClaimed(true);
    localStorage.setItem('aetherium_reward_claimed', 'true'); // Save to browser memory
  };

  // --- Real-time Ticket Fetching Logic ---
  useEffect(() => {
    const fetchTickets = async () => {
      if (user?.primaryEmailAddress?.emailAddress) {
        try {
          const res = await fetch(`http://localhost:8001/api/my-tickets?email=${user.primaryEmailAddress.emailAddress}`);
          if (res.ok) {
            const data = await res.json();
            setActiveTickets(data);
          }
        } catch (err) {
          console.error("Failed to sync tickets from HQ:", err);
        } finally {
          setFetching(false);
        }
      }
    };

    if (isLoaded) fetchTickets();
  }, [isLoaded, user]);

  // --- Dummy Payment Handler ---
  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch(`http://localhost:8001/api/bookings/${selectedTicket.id}/pay`, {
        method: 'PUT',
      });

      if (res.ok) {
        setActiveTickets(activeTickets.map(t => 
          t.id === selectedTicket.id ? { ...t, payment_status: true } : t
        ));
        setSelectedTicket(null);
        // Optional: Tum chaho toh payment hone ke baad reward reset kar sakte ho:
        // localStorage.removeItem('aetherium_reward_claimed');
        // setRewardClaimed(false);
      }
    } catch (error) {
      console.error("Payment error", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => window.print();

  if (!isLoaded || fetching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-600 font-black tracking-widest text-sm animate-pulse">SYNCING NEURAL PASSES...</p>
      </div>
    );
  }

  const hasTickets = activeTickets.length > 0;

  // --- 2. DISCOUNT MATH LOGIC ---
  // Agar ticket selected hai, toh final amount calculate karo
  const originalAmount = selectedTicket?.total_amount || 0;
  const discountAmount = rewardClaimed ? originalAmount * 0.10 : 0; // 10% discount
  const finalPayableAmount = originalAmount - discountAmount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-12 selection:bg-emerald-100">
      
      {/* --- PAYMENT MODAL --- */}
<AnimatePresence>
  {selectedTicket && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        {!isProcessing && (
          <button onClick={() => setSelectedTicket(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        )}

        <h2 className="text-xl font-black text-slate-800 mb-6">Aetherium Checkout</h2>
        
        {/* Order Summary Section */}
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 flex justify-between items-center relative overflow-hidden">
          {rewardClaimed && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest flex items-center gap-1">
              <Tag size={10} /> 10% OFF APPLIED
            </div>
          )}
          <div>
            <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Pass ID</div>
            <div className="text-slate-800 font-black">AETH-{selectedTicket.id}</div>
          </div>
          <div className="text-right pt-2">
            <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Total</div>
            <div className="text-2xl text-emerald-600 font-black">
               ₹{rewardClaimed ? finalPayableAmount : originalAmount}
            </div>
          </div>
        </div>

        {/* Method Selection */}
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Payment Method</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <button onClick={() => setPaymentMethod('upi')} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${paymentMethod === 'upi' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <Smartphone size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">UPI</span>
            </button>
            <button onClick={() => setPaymentMethod('card')} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <CreditCard size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">Card</span>
            </button>
            <button onClick={() => setPaymentMethod('bank')} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${paymentMethod === 'bank' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <Building size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">Net Bank</span>
            </button>
          </div>
        </div>

        {/* --- DYNAMIC PAYMENT FORM --- */}
        <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[100px] flex flex-col justify-center">
          {paymentMethod === 'card' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <input 
                type="text" 
                placeholder="4111 2222 3333 4444" 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="MM/YY" className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" />
                <input type="password" placeholder="CVV" className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            </motion.div>
          )}

          {paymentMethod === 'upi' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <input 
                type="text" 
                placeholder="ibrahim@upi" 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-1 text-center">Verify your UPI ID before paying</p>
            </motion.div>
          )}

          {paymentMethod === 'bank' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option>HDFC Bank</option>
                <option>SBI - Personal Banking</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
            </motion.div>
          )}
        </div>

        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full py-4 mt-6 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-500 transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-70 disabled:hover:bg-slate-900"
        >
          {isProcessing ? (
            <> <Loader2 size={18} className="animate-spin" /> Processing... </>
          ) : (
            <> Pay ₹{rewardClaimed ? finalPayableAmount : originalAmount} Now </>
          )}
        </button>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* --- DIGITAL RECEIPT MODAL --- */}
      <AnimatePresence>
        {receiptTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative print:shadow-none print:w-full print:max-w-none print:rounded-none"
            >
              {/* Top Check Icon & Title */}
              <div className="text-center mb-4">
                <div className="inline-flex p-2 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Entry Pass</h2>
                <p className="text-slate-500 text-xs font-medium">Aetherium Museum</p>
              </div>

              {/* Compact QR Code Section */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100 print:border-2 print:border-black print:bg-transparent">
                <div className="bg-white p-2 rounded-lg shadow-sm mb-2 print:border-none print:shadow-none">
                  <QrCode size={80} className="text-slate-900" />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scan at Counter</p>
                <p className="text-sm font-mono font-bold text-slate-800">AETH-{receiptTicket.id}</p>
              </div>

              {/* Compact Details */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Date</span>
                  <span className="text-slate-800 font-bold">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer</span>
                  <span className="text-slate-800 font-bold truncate max-w-[150px]">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
              </div>

              {/* Compact Order Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 print:bg-transparent print:border print:border-slate-200">
                <div className="space-y-2 text-xs font-medium border-b border-slate-200 pb-3 mb-3">
                  {receiptTicket.adult_tickets > 0 && (
                    <div className="flex justify-between"><span className="text-slate-600">{receiptTicket.adult_tickets}x Adult</span><span className="text-slate-800 font-bold">₹{receiptTicket.adult_tickets * 500}</span></div>
                  )}
                  {receiptTicket.child_tickets > 0 && (
                    <div className="flex justify-between"><span className="text-slate-600">{receiptTicket.child_tickets}x Child</span><span className="text-slate-800 font-bold">₹{receiptTicket.child_tickets * 250}</span></div>
                  )}
                  {receiptTicket.show_tickets > 0 && (
                    <div className="flex justify-between"><span className="text-slate-600">{receiptTicket.show_tickets}x 3D Show</span><span className="text-slate-800 font-bold">₹{receiptTicket.show_tickets * 300}</span></div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-800 text-xs">Total Paid</span>
                  <span className="text-lg font-black text-emerald-600">₹{receiptTicket.total_amount}</span>
                </div>
              </div>

              {/* Action Buttons (Hidden in Print) */}
              <div className="flex flex-col gap-2 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all flex justify-center items-center gap-2 shadow-md"
                >
                  <Printer size={16} /> Print Pass
                </button>
                <button 
                  onClick={() => setReceiptTicket(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all flex justify-center items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MAIN DASHBOARD (Hidden during print) --- */}
      <div className="max-w-5xl mx-auto print:hidden">
        
        {/* Navigation */}
        <nav className="mb-10 relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-all font-bold text-sm group bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Museum
          </Link>
        </nav>

        {/* Welcome Section */}
        <header className="mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3 tracking-tight">
              Welcome, <span className="text-emerald-500">{user?.firstName || "Explorer"}</span>!
            </h1>
            <p className="text-slate-500 font-medium text-lg">Your digital vault of museum experiences.</p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: Ticket List */}
          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <Ticket size={18} className="text-emerald-500" /> Active Passes
            </h2>

            <AnimatePresence mode="wait">
              {!hasTickets ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm"
                >
                  <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 ring-8 ring-white shadow-inner">
                    <ShoppingBag size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">No active passes</h3>
                  <p className="text-slate-500 mb-10 max-w-sm mx-auto text-base font-medium">
                    You haven't booked any sessions yet. Talk to the concierge to secure your spot!
                  </p>
                  <Link href="/" className="px-10 py-4 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all inline-block">
                    Book Now
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {activeTickets.map((ticket: any) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col sm:flex-row"
                    >
                      {/* Visual Ticket Part */}
                      <div className="bg-emerald-500 p-10 text-white flex flex-col justify-center items-center sm:w-1/3 border-b sm:border-b-0 sm:border-r border-dashed border-white/40 relative">
                         <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-50 rounded-full" />
                         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-50 rounded-full" />
                         
                         <div className="p-3 bg-white rounded-2xl shadow-lg mb-4">
                            <QrCode size={80} className="text-emerald-600" />
                         </div>
                         <span className="text-[10px] font-black tracking-[0.2em] opacity-80 uppercase text-center text-white/90">ID: AETH-{ticket.id}</span>
                      </div>

                     {/* Info Part */}
                      <div className="p-8 md:p-10 flex-1 flex flex-col justify-center bg-white relative">
                        
                        <div className="absolute top-6 right-6 md:right-8">
                          {ticket.payment_status ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                              Confirmed
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-sm">
                              Payment Pending
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-start mb-6 mt-4 sm:mt-0">
                          <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">Aetherium Premium Pass</h3>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              Booking Detail
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8 text-sm font-bold text-slate-600">
                          <div className="flex items-center gap-2">Adults: <span className="text-slate-800">{ticket.adult_tickets || 0}</span></div>
                          <div className="flex items-center gap-2">Child: <span className="text-slate-800">{ticket.child_tickets || 0}</span></div>
                          <div className="flex items-center gap-2">3D Show: <span className="text-slate-800">{ticket.show_tickets || 0}</span></div>
                          <div className="flex items-center gap-2 text-emerald-600 font-black">Total: ₹{ticket.total_amount}</div>
                        </div>

                        {/* CONDITIONAL FOOTER */}
                        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                          {!ticket.payment_status ? (
                            <button 
                              onClick={() => setSelectedTicket(ticket)}
                              className="px-6 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-emerald-500 transition-colors shadow-lg"
                            >
                              Pay ₹{ticket.total_amount} Now
                            </button>
                          ) : (
                            <button 
                              onClick={() => setReceiptTicket(ticket)}
                              className="text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              <Download size={14} /> View & Download Receipt
                            </button>
                          )}
                          <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest hidden sm:block">Digital Entry Only</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Insights */}
          <div className="lg:col-span-4 space-y-8">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Neural Insights</h2>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150" />
              <div className="relative z-10">
                <div className="p-4 bg-emerald-50 rounded-2xl w-fit mb-6 text-emerald-600 ring-1 ring-emerald-100">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Biometric Entry</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Your passes are tied to your identity: <br/>
                  <span className="text-emerald-600 font-bold underline decoration-emerald-200 underline-offset-4">{user?.primaryEmailAddress?.emailAddress}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 opacity-10">
                <Sparkles size={160} />
              </motion.div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3 text-center">Member Perk</p>
              <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight text-center">10% OFF on NEXT BOOKING</h3>
              <button 
                onClick={handleClaimReward}
                disabled={rewardClaimed}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${
                  rewardClaimed 
                    ? "bg-emerald-500 text-white cursor-default" 
                    : "bg-white text-slate-900 hover:bg-slate-100"
                }`}
              >
                {rewardClaimed ? (
                  <span className="flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Reward Claimed</span>
                ) : (
                  "Claim Reward"
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}