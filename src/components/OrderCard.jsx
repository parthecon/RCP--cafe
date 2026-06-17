import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, Play, Trash2, User, Hash, ArrowLeft, Pencil } from 'lucide-react';

export const OrderCard = ({ order, onUpdateStatus, onDelete, onEdit }) => {
  const { id, customerName, tableNumber, items, totalAmount, status, createdAt } = order;

  const [timeAgo, setTimeAgo] = useState('');
  
  // Swipe State
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const isMovingRef = useRef(false);

  useEffect(() => {
    const calculateTime = () => {
      const diffMs = Date.now() - createdAt;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor(diffMs / 1000);

      if (diffSecs < 60) {
        setTimeAgo('just now');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} min${diffMins > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [createdAt]);

  const getBorderColor = () => {
    switch (status) {
      case 'preparing':
        return 'border-l-[#A87C5C]';
      case 'done':
        return 'border-l-green-600';
      case 'pending':
      default:
        return 'border-l-red-550';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F7ECE6] text-[#A87C5C] border border-[#EFEAE4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A87C5C] animate-pulse"></span>
            Preparing
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-150">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Done
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-550 animate-pulse"></span>
            Pending
          </span>
        );
    }
  };

  // Touch Swipe Handlers (Mobile Swipe to Delete)
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    isMovingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isMovingRef.current || touchStartX === null || touchStartY === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault();
      
      if (isSwiped) {
        const newOffset = -80 + diffX;
        setSwipeOffset(Math.min(0, Math.max(-120, newOffset)));
      } else {
        if (diffX < 0) {
          setSwipeOffset(Math.max(-100, diffX));
        }
      }
    }
  };

  const handleTouchEnd = () => {
    isMovingRef.current = false;
    
    if (isSwiped) {
      if (swipeOffset > -40) {
        setSwipeOffset(0);
        setIsSwiped(false);
      } else {
        setSwipeOffset(-80);
        setIsSwiped(true);
      }
    } else {
      if (swipeOffset < -40) {
        setSwipeOffset(-80);
        setIsSwiped(true);
      } else {
        setSwipeOffset(0);
        setIsSwiped(false);
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl group min-h-[260px] no-print select-none shadow-sm border border-slate-100 bg-white">
      
      {/* Swipe Action Background (Delete Button revealed underneath) */}
      <div 
        onClick={() => onDelete(id)}
        className="absolute inset-y-0 right-0 w-24 bg-red-500 hover:bg-red-600 text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors z-0"
      >
        <Trash2 className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
      </div>

      {/* Front Card Panel (Swipes left-right) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)`, touchAction: 'pan-y' }}
        className={`relative z-10 w-full h-full bg-white border-l-[6px] p-4.5 flex flex-col justify-between transition-all duration-300 ease-out border-slate-105 ${getBorderColor()} hover:-translate-y-0.5 hover:shadow-md`}
      >
        <div>
          {/* Card Header */}
          <div className="flex justify-between items-start gap-2 mb-4 border-b border-slate-50 pb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="inline-block text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md font-mono tracking-wider">
                  #{id}
                </span>
                {getStatusBadge()}
              </div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {customerName}
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold">
                Table {tableNumber}
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-1.5 font-mono">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </div>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="space-y-2 mb-5">
            {items.map((item, idx) => (
              <div key={idx} className="border-b border-slate-50 pb-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 font-mono text-xs px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                      {item.quantity}x
                    </span>
                    <span className="text-slate-655 font-medium">{item.name}</span>
                  </div>
                  <span className="text-slate-800 font-mono text-xs font-bold">Rs. {item.price * item.quantity}</span>
                </div>
                {item.remark && (
                  <div className="mt-2 flex items-start gap-2 bg-orange-50 border-l-4 border-orange-400 rounded-r-xl px-3 py-2">
                    <span className="text-base leading-none mt-0.5">👨‍🍳</span>
                    <div>
                      <p className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider mb-0.5">Cooking Note</p>
                      <p className="text-xs font-bold text-orange-800 leading-snug">{item.remark}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card Footer & Action Buttons */}
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-lg font-black text-slate-900 font-mono">Rs. {totalAmount}</span>
          </div>

          <div className="flex gap-2">
            {status === 'pending' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(id, 'preparing')}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#A87C5C] hover:bg-[#8E6343] active:scale-98 text-white font-bold text-xs transition-all cursor-pointer shadow-sm min-h-[44px]"
              >
                <Play className="w-3.5 h-3.5" />
                Prepare Order
              </button>
            )}
            {status === 'preparing' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(id, 'done')}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 active:scale-98 text-white font-bold text-xs transition-all cursor-pointer shadow-sm min-h-[44px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete Order
              </button>
            )}
            {/* Edit button — visible on ALL screen sizes */}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(order)}
                className="inline-flex p-2.5 items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-600 transition-all border border-blue-100 hover:border-blue-200 min-w-[44px] min-h-[44px] cursor-pointer"
                title="Edit Order Items"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {!isSwiped && (
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="hidden sm:inline-flex p-2.5 items-center justify-center rounded-xl bg-[#FAF7F2] hover:bg-red-50 hover:text-red-550 active:scale-95 text-[#7C6C6C] transition-all border border-[#EFEAE4] hover:border-red-100 min-w-[44px] min-h-[44px] cursor-pointer"
                title="Delete Order"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Subtle swipe hint for mobile */}
          <div className="sm:hidden text-center text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-1 pointer-events-none">
            <ArrowLeft className="w-2.5 h-2.5 animate-pulse" />
            Swipe left to delete
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
