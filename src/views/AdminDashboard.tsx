import React, { useState } from 'react';
import { Equipment, EquipmentCategory, User, Booking, SupportComplaint } from '../types';
import {
  BarChart3,
  Users,
  Tractor,
  DollarSign,
  PlusCircle,
  Trash2,
  Edit,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { deleteEquipment, updateUserStatus, updateEquipmentOnboarding, processPayout } from '../services/api';

interface AdminDashboardProps {
  currentUser: User;
  analytics: any;
  equipmentList: Equipment[];
  categories: EquipmentCategory[];
  users: User[];
  bookings: Booking[];
  complaints: SupportComplaint[];
  onRefreshData: () => void;
  onOpenAddEquipmentModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  analytics,
  equipmentList,
  categories,
  users,
  bookings,
  complaints,
  onRefreshData,
  onOpenAddEquipmentModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'onboarding' | 'providers' | 'categories' | 'reports'>('overview');

  const handleDeleteEq = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment listing?')) {
      await deleteEquipment(id);
      onRefreshData();
    }
  };

  const handleApproveProvider = async (userId: string) => {
    await updateUserStatus(userId, 'active', true);
    onRefreshData();
  };
  const handleProductDecision = async (id: string, status: 'approved' | 'rejected') => {
    await updateEquipmentOnboarding(id, status, 'admin');
    onRefreshData();
  };
  const handlePayout = async (booking: Booking) => {
    if (!booking.payoutId || !window.confirm(`Confirm Demo/Manual Payout of ${formatCurrency(booking.providerAmount || 0)} for ${booking.providerName}?`)) return;
    if (await processPayout(booking.payoutId, currentUser.id)) onRefreshData();
  };

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,BookingID,Farmer,Equipment,Amount,Status\n' +
      bookings.map((b) => `${b.bookingNumber},${b.farmerName},${b.equipmentName},${b.totalAmount},${b.bookingStatus}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agriequip_bookings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const pendingProviders = users.filter((u) => u.role === 'provider' && u.status === 'pending_approval');
  const pendingProducts = equipmentList.filter((eq) => eq.onboardingStatus === 'pending_approval');
  const farmerAccounts = users.filter((user) => user.role === 'farmer').length;
  const verifiedProviders = users.filter((user) => user.role === 'provider' && user.isVerified && user.status === 'active').length;
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'Paid' && !['Rejected', 'Cancelled'].includes(booking.bookingStatus));
  const calculateBookingProfit = (booking: Booking) => Math.round((booking.rentalAmount + booking.deliveryCharge) * 0.1);
  const platformProfit = analytics?.platformProfit ?? paidBookings.reduce((total, booking) => total + calculateBookingProfit(booking), 0);
  const providerPayable = paidBookings.reduce((total, b) => total + (b.providerAmount ?? Math.max(0, b.rentalAmount + b.deliveryCharge - calculateBookingProfit(b))), 0);
  const pendingPayouts = paidBookings.filter(b => b.payoutStatus === 'Pending' || b.payoutStatus === 'Processing').reduce((total, b) => total + (b.providerAmount ?? 0), 0);
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      
      {/* Admin Title Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded uppercase">
            Master Console
          </span>
          <h2 className="text-xl font-bold text-white mt-1">VELANTECH Platform Operations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage equipment inventory, provider approvals, platform revenue, and district delivery fees.
          </p>
        </div>

        {onOpenAddEquipmentModal && (
          <button
            onClick={onOpenAddEquipmentModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>+ Add Equipment (With Real Photos)</span>
          </button>
        )}
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Platform Profit</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(platformProfit)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">10% on paid rental + delivery charges</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Farmer Accounts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{farmerAccounts}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Live count from registered accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Verified Providers</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{verifiedProviders}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">{pendingProviders.length} Pending Approval</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Total Equipment Listings</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{equipmentList.length}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Operational Yard Stock</div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><div><small className="text-slate-500">Farmer payments</small><b className="block text-lg">{formatCurrency(paidBookings.reduce((s,b)=>s+b.totalAmount,0))}</b></div><div><small className="text-slate-500">Platform commission</small><b className="block text-lg text-emerald-700">{formatCurrency(platformProfit)}</b></div><div><small className="text-slate-500">Provider payable</small><b className="block text-lg">{formatCurrency(providerPayable)}</b></div><div><small className="text-slate-500">Pending payouts</small><b className="block text-lg text-amber-700">{formatCurrency(pendingPayouts)}</b></div></div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div><h3 className="text-base font-bold text-slate-900">Platform profit by booking</h3><p className="text-slate-500 mt-1">Admin-only commission: 10% of rental and delivery charges. Deposits and GST are excluded.</p></div>
            <span className="font-bold text-emerald-700">{paidBookings.length} paid booking{paidBookings.length === 1 ? '' : 's'}</span>
          </div>
          {paidBookings.length === 0 ? <div className="text-center py-8 text-slate-500">Profit will appear here after a paid booking is recorded.</div> : (
            <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><th className="p-3">Booking</th><th className="p-3">Farmer</th><th className="p-3">Rental + Delivery</th><th className="p-3">Platform Profit</th></tr></thead><tbody className="divide-y divide-slate-100 font-medium text-slate-800">{paidBookings.map((booking) => <tr key={booking.id}><td className="p-3"><div className="font-bold text-slate-900">{booking.bookingNumber}</div><div className="text-slate-500">{booking.equipmentName}</div></td><td className="p-3">{booking.farmerName}</td><td className="p-3">{formatCurrency(booking.rentalAmount + booking.deliveryCharge)}</td><td className="p-3 font-bold text-emerald-700">{formatCurrency(calculateBookingProfit(booking))}</td></tr>)}</tbody></table></div>
          )}
          {paidBookings.length > 0 && <div className="overflow-x-auto"><h3 className="text-base font-bold text-slate-900 mt-6">Provider payouts</h3><table className="w-full text-left border-collapse mt-2"><thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><th className="p-3">Payout / booking</th><th className="p-3">Provider</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{paidBookings.map(b => <tr key={`p-${b.id}`}><td className="p-3"><b>{b.payoutId || 'Not eligible'}</b><div className="text-slate-500">{b.bookingNumber}</div></td><td className="p-3">{b.providerName}</td><td className="p-3">{formatCurrency(b.providerAmount ?? 0)}</td><td className="p-3">{b.payoutStatus || 'Pending'}</td><td className="p-3">{b.payoutStatus === 'Processing' ? <button onClick={() => handlePayout(b)} className="bg-emerald-600 text-white px-2 py-1 rounded">Process</button> : '—'}</td></tr>)}</tbody></table></div>}
        </div>
      )}

      {/* Navigation Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Analytics & Overview
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'equipment' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Manage Equipment ({equipmentList.length})
        </button>

        <button onClick={() => setActiveTab('onboarding')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === 'onboarding' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          Product onboarding ({pendingProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'providers' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Provider Approvals ({pendingProviders.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Export CSV Reports & Backup
        </button>
      </div>

      {/* TAB: Manage Equipment */}
      {activeTab === 'onboarding' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4 text-xs">
          <div><h3 className="text-base font-bold text-slate-900">Product onboarding queue</h3><p className="text-slate-500 mt-1">Review provider submissions before they become visible in the rental directory.</p></div>
          {pendingProducts.length === 0 ? <div className="text-center py-8 text-slate-500">No products are awaiting review.</div> : pendingProducts.map(eq => <div key={eq.id} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-3"><div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">{eq.images[0] ? <img src={eq.images[0]} alt="" className="w-full h-full object-cover rounded-lg" /> : <Tractor className="w-5 h-5" />}</div><div><p className="font-bold text-slate-900">{eq.name}</p><p className="text-slate-600">{eq.brand} · {eq.categoryName} · {eq.providerName}</p><p className="text-slate-500">{eq.location.village}, {eq.location.district}</p></div></div>
            <div className="flex items-center gap-2"><button onClick={() => handleProductDecision(eq.id, 'rejected')} className="border border-rose-200 text-rose-700 font-bold px-3 py-2 rounded-lg">Reject</button><button onClick={() => handleProductDecision(eq.id, 'approved')} className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-lg">Approve & publish</button></div>
          </div>)}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Equipment Inventory Management</h3>
            {onOpenAddEquipmentModal && (
              <button
                onClick={onOpenAddEquipmentModal}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Add Equipment</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Daily Price</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {equipmentList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                      {eq.images[0] ? <img src={eq.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" /> : <Tractor className="w-5 h-5 text-slate-400" />}
                      <span>{eq.name}</span>
                    </td>
                    <td className="p-3 text-slate-600">{eq.categoryName}</td>
                    <td className="p-3 font-bold text-emerald-700">₹{eq.dailyPrice}/day</td>
                    <td className="p-3 text-slate-600">{eq.location.village}, {eq.location.district}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                        {eq.onboardingStatus === 'pending_approval' ? 'Awaiting approval' : eq.onboardingStatus === 'rejected' ? 'Rejected' : eq.availabilityStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteEq(eq.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 font-bold"
                        title="Delete Equipment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Provider Approvals */}
      {activeTab === 'providers' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-900">Pending Equipment Provider Applications</h3>
          {pendingProviders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No pending provider applications.</div>
          ) : (
            pendingProviders.map((u) => (
              <div key={u.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{u.providerDetails?.businessName || u.name}</div>
                  <div className="text-slate-600">{u.phone} • {u.address.village}, {u.address.district}</div>
                  <div className="text-[10px] text-slate-500">Bank: {u.providerDetails?.bankName} ({u.providerDetails?.accountNumber})</div>
                </div>
                <button
                  onClick={() => handleApproveProvider(u.id)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Approve Provider
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Reports Export */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-900">CSV Export & System Database Backup</h3>
          <div className="flex space-x-3">
            <button
              onClick={handleExportCSV}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Bookings CSV Report</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
