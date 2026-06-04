import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Gamepad2, ShoppingCart, User, AlertCircle, Sparkles, ChefHat } from 'lucide-react';
import useMenu from '../hooks/useMenu';
import { useOrders } from '../hooks/useOrders';
import MenuCard from '../components/MenuCard';
import toast from 'react-hot-toast';

export const OrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { menu, loading, error } = useMenu();
  const { addOrder } = useOrders();

  // Get table number from URL search param e.g. ?table=3, default to "1"
  const tableNum = searchParams.get('table') || '1';

  // State
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart operations
  const handleQuantityChange = (itemId, qty) => {
    if (qty > 10) {
      toast.error('Maximum quantity per item is 10');
      return;
    }

    setCart(prev => {
      const updated = { ...prev };
      if (qty <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = qty;
      }
      return updated;
    });
  };

  // Get cart items detail
  const cartItems = Object.entries(cart).map(([id, quantity]) => {
    const item = menu.find(m => m.id === id);
    return item ? { ...item, quantity } : null;
  }).filter(Boolean);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter your name to place the order');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Please select at least one item.');
      return;
    }

    setIsSubmitting(true);
    const orderData = {
      customerName: customerName.trim(),
      tableNumber: parseInt(tableNum, 10) || 1,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount
    };

    try {
      const orderId = await addOrder(orderData);
      toast.success('Order placed successfully!');
      navigate(`/receipt/${orderId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter menu by category
  const filteredMenu = menu.filter(item => {
    if (!item.isAvailable) return false;
    return activeCategory === 'All' || item.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3C2F2F] pb-36 relative overflow-hidden">
      
      {/* Subtle warm backdrop blobs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#F7ECE6]/60 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#EFEAE4]/40 blur-3xl rounded-full pointer-events-none"></div>

      {/* Premium Floating Coffee Shop Header */}
      <div className="px-4 pt-4 sticky top-0 z-30 no-print">
        <header className="bg-white/90 backdrop-blur-md border border-[#EFEAE4] py-3.5 px-5 rounded-2xl shadow-sm max-w-4xl mx-auto flex flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
              ☕
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-wide text-[#3C2F2F] font-sans">
                  RCP Cafe
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-green-50 text-green-700 border border-green-100">
                  Online
                </span>
              </div>
              <p className="text-[9px] text-[#7C6C6C] font-semibold tracking-wider">Cyber Paradise</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7ECE6] text-[#A87C5C] border border-[#EFEAE4] font-extrabold text-[10px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Table {tableNum}
          </div>

        </header>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">
        
        {/* Customer Name Input card */}
        <section className="bg-white border border-[#EFEAE4] rounded-3xl p-5 shadow-sm">
          <h2 className="text-xs font-bold text-[#7C6C6C] uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#A87C5C]" />
            Customer Information
          </h2>
          <div>
            <label htmlFor="customer-name" className="sr-only">Your Name</label>
            <input
              id="customer-name"
              type="text"
              placeholder="Enter your name to start ordering..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full h-12 px-4 bg-[#FAF7F2]/40 border border-[#EFEAE4] focus:border-[#A87C5C] rounded-xl text-[#3C2F2F] text-sm sm:text-base placeholder:text-[#7C6C6C]/60 focus:outline-none transition-colors"
            />
          </div>
        </section>

        {/* Menu Section */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-base sm:text-lg font-black text-[#3C2F2F] flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#A87C5C]" />
              Menu Card
            </h2>
            
            {/* Category Filter Pills */}
            <div className="flex bg-[#EFEAE4]/50 p-1 rounded-2xl border border-[#EFEAE4] w-full sm:w-auto overflow-x-auto scrollbar-none gap-1">
              {['All', 'Food', 'Drinks', 'Snacks'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat 
                      ? 'bg-[#3C2F2F] text-white shadow-sm' 
                      : 'text-[#7C6C6C] hover:text-[#3C2F2F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid: 2 columns on mobile, 3 on desktop */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#A87C5C] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Failed to load menu: {error}</p>
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#EFEAE4] border-dashed">
              <p className="text-[#7C6C6C] text-sm">No items available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              {filteredMenu.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] || 0}
                  onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Checkout Drawer (Sticky bottom) */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 bg-white border border-[#EFEAE4] px-5 py-4 rounded-3xl shadow-xl animate-slide-up no-print max-w-4xl mx-auto">
          <div className="flex flex-row items-center justify-between gap-4">
            
            {/* Summary info */}
            <div className="flex items-center gap-3.5 w-auto">
              <div className="relative p-2.5 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] rounded-2xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#A87C5C] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse font-mono">
                  {totalCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-[#7C6C6C] font-bold uppercase tracking-wider">Total Amount</p>
                <p className="text-base sm:text-lg font-black text-[#3C2F2F] font-mono leading-none">Rs. {totalAmount}</p>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:px-10 py-3 bg-[#3C2F2F] hover:bg-[#4E3629] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-2 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Ordering...
                </>
              ) : (
                'Place Order'
              )}
            </button>

          </div>
        </div>
      )}
    </div>
  );
};


export default OrderPage;
