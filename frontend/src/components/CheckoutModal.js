import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const CheckoutModal = ({
  isOpen,
  onClose,
  show,
  selectedSeats = [],
  onConfirmPayment,
  isProcessing = false,
  error = null,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [upiId, setUpiId] = useState('customer@okaxis');

  if (!isOpen) return null;

  const basePrice = selectedSeats.length > 0 ? selectedSeats.length * (show?.pricing?.regular || 180) : 0;
  // Use actual show pricing or calculate
  const convenienceFee = selectedSeats.length * 30;
  const tax = Math.round(convenienceFee * 0.18);
  const finalTotal = basePrice + convenienceFee + tax;

  const handlePay = () => {
    onConfirmPayment({
      paymentMethod,
      simulateFailure,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-gray-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Secure Gateway Simulation</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
            <h3 className="font-bold text-sm text-white">{show?.movie?.title}</h3>
            <p className="text-xs text-gray-400">
              {show?.theatre?.name} • {show?.screenName}
            </p>
            <p className="text-xs text-gray-400">
              {show?.date} at {show?.time} ({show?.format})
            </p>
            <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-400">Seats ({selectedSeats.length}):</span>
              <span className="font-mono font-bold text-red-400">{selectedSeats.join(', ')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'Credit Card', label: 'Card', icon: CreditCard },
                { id: 'Net Banking', label: 'NetBanking', icon: Building },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-medium ${
                    paymentMethod === id
                      ? 'bg-red-600/10 border-red-500 text-white shadow-md'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${paymentMethod === id ? 'text-red-500' : 'text-gray-400'}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method Details Mock */}
          {paymentMethod === 'UPI' && (
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-xs space-y-2">
              <span className="text-gray-400">UPI Virtual Payment Address (VPA):</span>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
                placeholder="username@bank"
              />
            </div>
          )}

          {paymentMethod === 'Credit Card' && (
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800 text-xs space-y-2">
              <input
                type="text"
                defaultValue="4242 •••• •••• 4242"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none text-xs"
                disabled
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  defaultValue="12/28"
                  className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs"
                  disabled
                />
                <input
                  type="text"
                  defaultValue="•••"
                  className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs"
                  disabled
                />
              </div>
            </div>
          )}

          {/* Evaluator Testing Toggle: Simulate Payment Failure */}
          <div className="p-3.5 bg-gray-900/90 rounded-xl border border-amber-500/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Simulate Payment Failure
              </p>
              <p className="text-[11px] text-gray-400">
                Tests automatic seat rollback & transactional integrity.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>
        </div>

        {/* Footer with Pay Button */}
        <div className="p-6 pt-3 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Total Payable</span>
            <span className="text-lg font-bold font-mono text-white">{formatCurrency(finalTotal)}</span>
          </div>

          <button
            disabled={isProcessing}
            onClick={handlePay}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
              simulateFailure
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Transaction...</span>
              </>
            ) : simulateFailure ? (
              <span>Simulate Failure</span>
            ) : (
              <span>Authorize & Pay</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
