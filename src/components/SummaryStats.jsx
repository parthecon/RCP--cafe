import React from 'react';
import { ShoppingBag, DollarSign, Award, AlertCircle, TrendingUp } from 'lucide-react';

export const SummaryStats = ({ orders }) => {
  // Get start of today (midnight)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  // Filter orders for today
  const todayOrders = orders.filter(order => order.createdAt >= startOfTodayMs);

  // 1. Total Orders Today
  const totalOrders = todayOrders.length;

  // 2. Total Revenue Today
  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // 3. Status Counts
  const statusCounts = todayOrders.reduce(
    (acc, order) => {
      const status = order.status || 'pending';
      if (acc[status] !== undefined) {
        acc[status]++;
      }
      return acc;
    },
    { pending: 0, preparing: 0, done: 0 }
  );

  // 4. Most Ordered Item Today
  const itemCounts = {};
  todayOrders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });

  let mostOrderedItem = 'None';
  let mostOrderedQty = 0;
  Object.entries(itemCounts).forEach(([name, qty]) => {
    if (qty > mostOrderedQty) {
      mostOrderedQty = qty;
      mostOrderedItem = name;
    }
  });

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards Grid: 2-column on mobile/tablet, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Total Orders (Orange Icon) */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="p-2.5 sm:p-3.5 bg-orange-50 text-orange-500 rounded-xl border border-orange-100 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="block text-[10px] sm:text-xs font-bold text-slate-455 uppercase tracking-wider truncate">Total Orders</span>
            <span className="text-xl sm:text-2xl font-black text-slate-850 font-mono">{totalOrders}</span>
          </div>
        </div>

        {/* Card 2: Total Revenue (Green Icon) */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="p-2.5 sm:p-3.5 bg-green-50 text-green-600 rounded-xl border border-green-100 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="block text-[10px] sm:text-xs font-bold text-slate-455 uppercase tracking-wider truncate">Total Revenue</span>
            <span className="text-xl sm:text-2xl font-black text-slate-850 font-mono leading-none">Rs.{totalRevenue}</span>
          </div>
        </div>

        {/* Card 3: Most Ordered (Teal Icon) */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="p-2.5 sm:p-3.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="block text-[10px] sm:text-xs font-bold text-slate-455 uppercase tracking-wider truncate">Most Ordered</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 truncate block max-w-[90px] sm:max-w-[140px]" title={mostOrderedItem}>
              {mostOrderedItem}
            </span>
          </div>
        </div>

        {/* Card 4: Pending Count (Red Icon) */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="p-2.5 sm:p-3.5 bg-red-50 text-red-500 rounded-xl border border-red-100 shrink-0">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="block text-[10px] sm:text-xs font-bold text-slate-455 uppercase tracking-wider truncate">Pending Orders</span>
            <span className="text-xl sm:text-2xl font-black text-slate-855 font-mono">{statusCounts.pending}</span>
          </div>
        </div>

      </div>

      {/* Visual status counts breakdown panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-extrabold text-slate-850">Order Status Breakdown</h4>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
            Live data active
          </span>
        </div>
        
        {totalOrders > 0 ? (
          <div className="space-y-4">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${(statusCounts.pending / totalOrders) * 100}%` }} 
                className="bg-red-500 transition-all duration-500"
                title={`Pending: ${statusCounts.pending}`}
              ></div>
              <div 
                style={{ width: `${(statusCounts.preparing / totalOrders) * 100}%` }} 
                className="bg-yellow-500 transition-all duration-500"
                title={`Preparing: ${statusCounts.preparing}`}
              ></div>
              <div 
                style={{ width: `${(statusCounts.done / totalOrders) * 100}%` }} 
                className="bg-green-500 transition-all duration-500"
                title={`Done: ${statusCounts.done}`}
              ></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-500 border-t border-slate-50 pt-4">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0"></span>
                <span>Pending: <span className="text-slate-800 font-mono">{statusCounts.pending}</span> ({Math.round((statusCounts.pending / totalOrders) * 105)}%)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block shrink-0"></span>
                <span>Preparing: <span className="text-slate-800 font-mono">{statusCounts.preparing}</span> ({Math.round((statusCounts.preparing / totalOrders) * 105)}%)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shrink-0"></span>
                <span>Done: <span className="text-slate-800 font-mono">{statusCounts.done}</span> ({Math.round((statusCounts.done / totalOrders) * 105)}%)</span>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-center py-6 text-slate-400 text-sm">No orders recorded today.</p>
        )}
      </div>

    </div>
  );
};

export default SummaryStats;
