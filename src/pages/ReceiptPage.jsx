import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle2, Gamepad2, AlertCircle, Share2, Award } from 'lucide-react';
import { useOrder } from '../hooks/useOrders';
import { triggerVibration } from '../utils/notifications';
import toast from 'react-hot-toast';

export const ReceiptPage = () => {
  const { orderId } = useParams();
  const { order, loading, error } = useOrder(orderId);
  const [showDoneModal, setShowDoneModal] = useState(false);
  
  // Track previous status to alert only on changes during this session
  const prevStatusRef = useRef(null);

  useEffect(() => {
    if (order) {
      const currentStatus = order.status;
      
      // If we already had a status recorded, check for transitions
      if (prevStatusRef.current !== null) {
        if (prevStatusRef.current === 'pending' && currentStatus === 'preparing') {
          toast('🍳 Your order is now being prepared!', {
            icon: '🔥',
            duration: 5000,
          });
          triggerVibration([200, 100, 200]);
        } else if (prevStatusRef.current === 'preparing' && currentStatus === 'done') {
          toast.success('🎉 Your order is ready! Enjoy your food/drinks!', {
            duration: 6000,
          });
          setShowDoneModal(true);
          triggerVibration([500, 100, 500]);
        } else if (prevStatusRef.current === 'pending' && currentStatus === 'done') {
          toast.success('🎉 Your order is ready! Enjoy your food/drinks!');
          setShowDoneModal(true);
          triggerVibration([500, 100, 500]);
        }
      }
      
      prevStatusRef.current = currentStatus;
    }
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!order) return;
    
    const shareData = {
      title: 'Cafe Receipt',
      text: `Hey, here is my receipt from Cafe (Table ${order.tableNumber})! Total: Rs. ${order.totalAmount}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Receipt shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Receipt link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-55 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-6 text-center space-y-4 shadow-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Receipt Not Found</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            We couldn't find an order with ID <span className="font-mono text-teal-600 font-extrabold">{orderId}</span>. It might have been deleted or doesn't exist.
          </p>
          <div className="pt-2">
            <Link
              to="/order"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Order Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3C2F2F] py-12 px-4 print:bg-white print:text-black print:py-0 relative overflow-hidden">
      
      {/* Warm glowing backdrops */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#F7ECE6]/80 blur-3xl rounded-full pointer-events-none print:hidden"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#EFEAE4]/60 blur-3xl rounded-full pointer-events-none print:hidden"></div>

      {/* Back button (Hidden on Print) */}
      <div className="max-w-md mx-auto mb-6 no-print relative z-10">
        <Link
          to={`/order?table=${order.tableNumber}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C6C6C] hover:text-[#3C2F2F] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Order Page
        </Link>
      </div>

      {/* Receipt Card */}
      <div className="max-w-md mx-auto bg-white border border-[#EFEAE4] rounded-3xl overflow-hidden shadow-xl relative z-10 print:border-none print:shadow-none print:bg-white print:max-w-full">
        
        {/* Receipt Header */}
        <div className="bg-[#FAF7F2]/50 border-b border-[#EFEAE4] px-6 py-8 text-center relative print:bg-transparent print:border-slate-200">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#A87C5C] print:hidden"></div>
          
          <div className="mx-auto w-12 h-12 rounded-full bg-[#F7ECE6] text-[#A87C5C] flex items-center justify-center mb-3 border border-[#EFEAE4] print:hidden">
            <CheckCircle2 className="w-6 h-6 animate-bounce" />
          </div>
          
          <div className="flex justify-center items-center gap-2 mb-1.5 text-[#3C2F2F]">
            <Gamepad2 className="w-5 h-5 text-[#A87C5C]" />
            <h1 className="text-lg font-black tracking-wider uppercase font-sans text-[#3C2F2F]">Cafe</h1>
          </div>
          <p className="text-[10px] text-[#7C6C6C] uppercase tracking-widest font-extrabold">Food & Drinks Receipt</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-6 print:p-0">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-b border-[#EFEAE4] pb-5 text-[#7C6C6C]">
            <div>
              <span className="block text-[10px] text-[#7C6C6C] uppercase font-bold tracking-wider">Order ID</span>
              <span className="font-mono font-bold text-[#3C2F2F] text-xs sm:text-sm">{order.id}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#7C6C6C] uppercase font-bold tracking-wider">Table No.</span>
              <span className="font-bold text-[#A87C5C] text-sm">Table {order.tableNumber}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#7C6C6C] uppercase font-bold tracking-wider">Customer Name</span>
              <span className="font-bold text-[#3C2F2F] text-sm capitalize">{order.customerName}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#7C6C6C] uppercase font-bold tracking-wider">Time</span>
              <span className="text-[#7C6C6C] text-xs">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <span className="block text-[10px] text-[#7C6C6C] uppercase font-bold tracking-wider mb-2">Itemized Order</span>
            
            <div className="space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="border-b border-slate-50 pb-1.5 last:border-b-0">
                  <div className="flex justify-between items-center text-sm text-[#3C2F2F]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#7C6C6C] text-xs">{item.quantity}x</span>
                      <span className="text-[#3C2F2F] font-medium">{item.name}</span>
                    </div>
                    <span className="text-[#3C2F2F] font-mono text-xs font-bold">Rs. {item.price * item.quantity}</span>
                  </div>
                  {item.remark && (
                    <div className="text-[10px] text-orange-655 italic mt-0.5 ml-6">
                      Note: {item.remark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="border-t border-dashed border-[#EFEAE4] py-1"></div>

          {/* Summary / Total */}
          <div className="flex justify-between items-center border-b border-[#EFEAE4] pb-5 text-[#3C2F2F]">
            <div>
              <span className="block text-[10px] text-[#7C6C6C] font-bold uppercase tracking-wider">Order Status</span>
              <span className={`inline-block text-[9px] font-black uppercase mt-1.5 px-2.5 py-0.5 rounded-lg border ${
                order.status === 'done' ? 'bg-green-50 text-green-700 border-green-150' :
                order.status === 'preparing' ? 'bg-[#F7ECE6] text-[#A87C5C] border-[#EFEAE4]' :
                'bg-red-50 text-red-700 border-red-100'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#7C6C6C] uppercase font-bold tracking-wider">Total Paid</span>
              <span className="text-xl sm:text-2xl font-black text-[#A87C5C] font-mono">Rs. {order.totalAmount}</span>
            </div>
          </div>

          {/* Thank You Note */}
          <div className="text-center py-2">
            <p className="text-xs text-[#7C6C6C] italic">
              Thank you for ordering!
            </p>
            <p className="text-[10px] text-[#7C6C6C] mt-1">
              Please present this receipt screen or printout to the counter.
            </p>
          </div>

        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="no-print bg-[#FAF7F2] border-t border-[#EFEAE4] p-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-slate-50 text-[#3C2F2F] font-bold text-xs rounded-2xl border border-[#EFEAE4] active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <Share2 className="w-4 h-4 text-[#A87C5C]" />
            Share Receipt
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-[#3C2F2F] hover:bg-[#4E3629] text-white font-bold text-xs rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>


      {/* Done Modal Pop-Up (Hidden on Print) */}
      {showDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-5 relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-green-500"></div>
            
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 border border-green-100 text-green-600 flex items-center justify-center shadow-md">
              <Award className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Your Order is Ready!</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Table {order.tableNumber}, {order.customerName}! Your order <span className="font-mono font-bold text-teal-600">#{order.id}</span> has been prepared and is ready at the desk.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDoneModal(false)}
              className="w-full py-2.5 bg-green-500 hover:bg-green-655 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              Acknowledge & Enjoy!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptPage;
