import React from 'react';
import { Booking } from '../types';
import { X, Printer, Download, Tractor, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  booking: Booking;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 my-8 print:p-0 print:shadow-none print:border-none">
        
        {/* Invoice Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">
              <Tractor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">VELANTECH</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Official Tax Invoice</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">{booking.bookingNumber}</div>
            <div className="text-[10px] text-slate-500">Date: {booking.createdAt}</div>
            <span className="inline-block mt-1 bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
              Status: {booking.paymentStatus}
            </span>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Renter (Farmer)</span>
            <div className="font-bold text-slate-900">{booking.farmerName}</div>
            <div className="text-slate-600">{booking.farmerPhone}</div>
            <div className="text-slate-600">
              {booking.farmerAddress.village}, {booking.farmerAddress.district}, {booking.farmerAddress.state} - {booking.farmerAddress.pincode}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Equipment Provider</span>
            <div className="font-bold text-slate-900">{booking.providerName}</div>
            <div className="text-slate-600">GSTIN: 33AABCU9603R1ZM</div>
            <div className="text-slate-600">Verified Agri Machinery Partner</div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px]">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3">Rental Dates</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-3 font-bold text-slate-900">
                  {booking.equipmentName} ({booking.rentalType.toUpperCase()} PLAN)
                </td>
                <td className="p-3 text-slate-600">{booking.startDate} to {booking.endDate}</td>
                <td className="p-3 text-right font-bold">₹{booking.rentalAmount.toLocaleString('en-IN')}</td>
              </tr>
              {booking.deliveryCharge > 0 && (
                <tr>
                  <td className="p-3 font-semibold">Flatbed Operator Delivery & Pick-up Fee</td>
                  <td className="p-3 text-slate-500">Doorstep Farm Delivery</td>
                  <td className="p-3 text-right font-bold">₹{booking.deliveryCharge}</td>
                </tr>
              )}
              <tr>
                <td className="p-3 font-semibold">Refundable Machinery Security Deposit</td>
                <td className="p-3 text-slate-500">Refunded upon return</td>
                <td className="p-3 text-right font-bold">₹{booking.depositAmount}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="p-3 text-right">GST (12%):</td>
                <td className="p-3 text-right">₹{booking.gstAmount}</td>
              </tr>
              <tr className="bg-slate-900 text-emerald-400 font-bold text-sm">
                <td colSpan={2} className="p-3 text-right">Total Paid via {booking.paymentMethod}:</td>
                <td className="p-3 text-right">₹{booking.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Computer generated invoice. No signature required.</span>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
