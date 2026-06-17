import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, LogOut, ClipboardList, Utensils, BarChart3, QrCode, AlertCircle, Menu, X, UserCheck, Volume2, VolumeX, PlusCircle } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { signOutAdmin, saveAdminPushToken } from '../firebase/dbService';
import { messaging } from '../firebase/config';
import { getToken } from 'firebase/messaging';
import { subscribeAdmin } from '../utils/onesignal';
import { 
  playNotificationSound, 
  triggerVibration, 
  requestNotificationPermission, 
  showBrowserNotification,
  initAudioContext,
  isAudioSuspended
} from '../utils/notifications';
import OrderCard from '../components/OrderCard';
import MenuCRUD from '../components/MenuCRUD';
import SummaryStats from '../components/SummaryStats';
import QRGenerator from '../components/QRGenerator';
import AdminOrderModal from '../components/AdminOrderModal';
import EditOrderModal from '../components/EditOrderModal';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { orders, loading, error, updateStatus, deleteOrder, addOrder, updateItems } = useOrders();
  const [activeTab, setActiveTab] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('All');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [audioLocked, setAudioLocked] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null); // order object being edited

  // Notification and sound tracking refs
  const prevOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();

    const setupPushNotifications = async () => {
      if (messaging) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await getToken(messaging, {
              vapidKey: 'BBtqwJhTIqSpFLWJ84T1O2jdCgcHiUh6T7TTFfzN1_D9LHmqGDieYgf-Uoh0w4YdvA1YpYzybzEB2CZ1MD4XPaM'
            });
            if (token) {
              await saveAdminPushToken(token);
              console.log("Admin registered for background push notifications successfully.");
            } else {
              console.warn("FCM token generation failed.");
            }
          }
        } catch (err) {
          console.error("Failed to setup background push notifications:", err);
        }
      }

      try {
        subscribeAdmin();
      } catch (err) {
        console.error("Failed to register OneSignal Web Push subscription:", err);
      }
    };
    setupPushNotifications();

    const checkAudio = () => {
      setAudioLocked(isAudioSuspended());
    };

    const handleInteraction = () => {
      initAudioContext();
      setAudioLocked(false);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    checkAudio();

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Sync title badge and trigger alerts for new incoming orders
  useEffect(() => {
    if (loading) return;

    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    // 1. Dynamic Tab Title Badge
    const pendingCount = pendingOrders.length;
    if (pendingCount > 0) {
      document.title = `(❌ ${pendingCount}) RCP Dashboard`;
    } else {
      document.title = 'RCP Dashboard';
    }

    // 2. Alert for New Orders
    if (isFirstLoadRef.current) {
      // Store initial ids without firing alerts
      prevOrderIdsRef.current = new Set(orders.map(o => o.id));
      isFirstLoadRef.current = false;
    } else {
      let newlyArrivedOrder = null;
      
      orders.forEach(order => {
        if (order.status === 'pending' && !prevOrderIdsRef.current.has(order.id)) {
          newlyArrivedOrder = order;
        }
      });

      // Update known IDs
      prevOrderIdsRef.current = new Set(orders.map(o => o.id));

      if (newlyArrivedOrder) {
        toast.success(`🔔 New Order #${newlyArrivedOrder.id} from Table ${newlyArrivedOrder.tableNumber}!`, {
          duration: 6005,
          position: 'top-right'
        });
        
        playNotificationSound();
        triggerVibration([200, 100, 200]);
        
        showBrowserNotification(`New Order #${newlyArrivedOrder.id}`, {
          body: `Table ${newlyArrivedOrder.tableNumber} - ${newlyArrivedOrder.customerName} placed an order for Rs. ${newlyArrivedOrder.totalAmount}.`,
          tag: newlyArrivedOrder.id
        });
      }
    }
  }, [orders, loading]);

  const handleLogout = async () => {
    try {
      await signOutAdmin();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order record?')) {
      try {
        await deleteOrder(orderId);
        toast.success('Order deleted');
      } catch (err) {
        toast.error('Failed to delete order');
      }
    }
  };

  const handleNewOrder = async (orderData) => {
    try {
      await addOrder(orderData);
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
      throw err;
    }
  };

  const handleUpdateItems = async (orderId, items, totalAmount) => {
    try {
      await updateItems(orderId, items, totalAmount);
      toast.success('Order updated!');
    } catch (err) {
      toast.error('Failed to update order');
      throw err;
    }
  };

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'All') return true;
    return order.status === orderFilter.toLowerCase();
  });

  // Calculate badge counts
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const doneCount = orders.filter(o => o.status === 'done').length;

  const tabs = [
    { id: 'orders', label: 'Live Orders', icon: ClipboardList },
    { id: 'menu', label: 'Menu CRUD', icon: Utensils },
    { id: 'stats', label: 'Today\'s Summary', icon: BarChart3 },
    { id: 'qr', label: 'QR Generator', icon: QrCode }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileSidebarOpen(false); // Close mobile sliding menu
  };

  const renderActiveTabTitle = () => {
    switch (activeTab) {
      case 'orders':
        return 'Live Orders Overview';
      case 'menu':
        return 'Menu Database';
      case 'stats':
        return 'Business Statistics';
      case 'qr':
        return 'Table QR Codes';
      default:
        return 'Dashboard Overview';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex text-[#3C2F2F] relative">
      
      {/* Mobile Sidebar backdrop overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#3C2F2F]/20 backdrop-blur-sm md:hidden no-print"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar (Cozy Light Cream Style) */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white text-[#3C2F2F] p-6 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 border-r border-[#EFEAE4] no-print ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] rounded-xl">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black tracking-widest text-[#3C2F2F] uppercase font-sans">
                  RCP CAFE
                </span>
                <span className="block text-[9px] text-[#7C6C6C] font-bold uppercase tracking-widest leading-none">Cyber Paradise</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-[#7C6C6C] hover:text-[#3C2F2F] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border-l-4 cursor-pointer ${
                    isActive
                      ? 'bg-[#F7ECE6] text-[#3C2F2F] border-l-[#A87C5C] shadow-sm'
                      : 'text-[#7C6C6C] hover:text-[#3C2F2F] hover:bg-[#FAF7F2]/50 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#A87C5C]' : ''}`} />
                    {tab.label}
                  </div>
                  {tab.id === 'orders' && pendingCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#A87C5C] text-white text-[10px] font-black flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="pt-6 border-t border-[#EFEAE4]/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F7ECE6] border border-[#EFEAE4] flex items-center justify-center text-[#A87C5C]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="block text-xs font-black text-[#3C2F2F] uppercase truncate">Rajeshwar Admin</span>
            <span className="block text-[10px] text-[#7C6C6C] truncate">admin@rcp.com</span>
          </div>
        </div>

      </aside>

      {/* Main Workspace (Light Slate Theme) */}
      <div className="flex-1 min-h-screen flex flex-col overflow-hidden bg-[#FAF7F2]">
        
        {/* Top Control Bar */}
        <header className="no-print bg-white border-b border-[#EFEAE4] px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#FAF7F2] border border-[#EFEAE4] text-[#7C6C6C] hover:text-[#3C2F2F] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open Navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-base sm:text-lg font-black text-[#3C2F2F] tracking-wide font-sans">
              {renderActiveTabTitle()}
            </h2>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF7F2] hover:bg-red-50 hover:text-red-655 border border-[#EFEAE4] hover:border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-6 overflow-y-auto">

          <div className="max-w-7xl mx-auto">
            
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Sub-Filters tab bar */}
                <div className="grid grid-cols-4 sm:flex bg-white p-1 rounded-xl border border-[#EFEAE4] shadow-sm w-full sm:w-auto gap-1 self-stretch sm:self-start no-print">
                  {[
                    { key: 'All', label: 'All', mobileLabel: 'All', count: orders.length },
                    { key: 'Pending', label: 'Pending', mobileLabel: 'Pend', count: pendingCount, badgeColor: 'bg-red-50 text-red-700' },
                    { key: 'Preparing', label: 'Preparing', mobileLabel: 'Prep', count: preparingCount, badgeColor: 'bg-[#F7ECE6] text-[#A87C5C]' },
                    { key: 'Done', label: 'Done', mobileLabel: 'Done', count: doneCount, badgeColor: 'bg-green-50 text-green-700' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setOrderFilter(filter.key)}
                      className={`px-1 py-2 sm:px-4 sm:py-2 rounded-lg text-[10px] xs:text-xs sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                        orderFilter === filter.key
                          ? 'bg-[#3C2F2F] text-white shadow-sm'
                          : 'text-[#7C6C6C] hover:text-[#3C2F2F] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <span className="hidden xs:inline">{filter.label}</span>
                      <span className="xs:hidden">{filter.mobileLabel}</span>
                      <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-black shrink-0 ${
                        orderFilter === filter.key 
                          ? 'bg-white text-[#3C2F2F]' 
                          : filter.badgeColor || 'bg-[#FAF7F2] text-[#7C6C6C]'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* + New Order CTA */}
                <button
                  type="button"
                  onClick={() => setIsNewOrderOpen(true)}
                  className="no-print flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3C2F2F] hover:bg-[#4E3629] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer min-h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Order
                </button>
              </div>

                {audioLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      initAudioContext();
                      setAudioLocked(false);
                    }}
                    className="w-full bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#F7ECE6]/80 transition-all cursor-pointer animate-pulse no-print"
                  >
                    <VolumeX className="w-4.5 h-4.5 shrink-0" />
                    <span>Sound Alerts Muted. Tap here to enable order chime sounds!</span>
                  </button>
                )}

                {/* Orders Feed Cards Grid */}
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-650 text-sm no-print">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Failed to sync orders: {error}</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 no-print shadow-sm">
                    <p className="text-slate-450 text-sm">No orders found in {orderFilter} status.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteOrder}
                        onEdit={(o) => setEditingOrder(o)}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}

            {activeTab === 'menu' && <MenuCRUD />}

            {activeTab === 'stats' && <SummaryStats orders={orders} />}

            {activeTab === 'qr' && <QRGenerator />}

          </div>
        </main>
        
      </div>

      {/* New Order Modal */}
      {isNewOrderOpen && (
        <AdminOrderModal
          onClose={() => setIsNewOrderOpen(false)}
          onSubmit={handleNewOrder}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleUpdateItems}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
