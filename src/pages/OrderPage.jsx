import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Gamepad2, ShoppingCart, User, AlertCircle, Sparkles, ChefHat, Search, X, CookingPot, Utensils, MessageSquare } from 'lucide-react';
import useMenu from '../hooks/useMenu';
import { useOrders } from '../hooks/useOrders';
import { subscribeToCategories } from '../firebase/dbService';
import { verifyTableSignature, generateTableSignature } from '../utils/security';
import MenuCard from '../components/MenuCard';
import toast from 'react-hot-toast';

export const OrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { menu, loading, error } = useMenu();
  const { addOrder } = useOrders();

  // Get table number and token from URL
  const tableNum = searchParams.get('table') || '1';
  const token = searchParams.get('token') || '';

  // Option C: Auto-redirect legacy QR codes that have no token at all.
  // This runs BEFORE any state/effects so it is a clean redirect.
  useEffect(() => {
    if (!token) {
      // Old QR — silently add the correct token and reload in-place
      const correctToken = generateTableSignature(tableNum);
      navigate(`/order?table=${tableNum}&token=${correctToken}`, { replace: true });
    }
  }, [tableNum, token, navigate]);

  // If token is present but wrong → someone tampered with the URL
  const isTableValid = !token || verifyTableSignature(tableNum, token);

  // Dynamic States
  const [categories, setCategories] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart: { [itemId_variantName]: { id, name, price, quantity, remark, variant } }
  const [cart, setCart] = useState({});

  // Active variant states for each menu item card: { [itemId]: selectedVariantName }
  const [itemVariants, setItemVariants] = useState({});

  // Load Categories dynamically
  useEffect(() => {
    const unsubscribe = subscribeToCategories(setCategories);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Set default variants for items when menu loads
  useEffect(() => {
    if (menu && menu.length > 0) {
      const initialVariants = {};
      menu.forEach(item => {
        if (item.variants && item.variants.length > 0) {
          initialVariants[item.id] = item.variants[0].name;
        }
      });
      setItemVariants(initialVariants);
    }
  }, [menu]);

  // Cart operations
  const handleQuantityChange = (cartKey, qty, variantName = null, item = null) => {
    if (qty > 10) {
      toast.error('Maximum quantity per item is 10');
      return;
    }

    setCart(prev => {
      const updated = { ...prev };
      if (qty <= 0) {
        delete updated[cartKey];
      } else {
        if (updated[cartKey]) {
          updated[cartKey].quantity = qty;
        } else if (item) {
          const price = variantName && item.variants
            ? (item.variants.find(v => v.name === variantName)?.price || item.price)
            : item.price;
          
          updated[cartKey] = {
            id: item.id,
            name: item.name,
            price: price,
            quantity: qty,
            remark: '',
            variant: variantName || ''
          };
        }
      }
      return updated;
    });
  };

  const handleRemarkChange = (cartKey, remark) => {
    setCart(prev => {
      if (!prev[cartKey]) return prev;
      return {
        ...prev,
        [cartKey]: {
          ...prev[cartKey],
          remark: remark
        }
      };
    });
  };

  // Get cart items list
  const cartItems = Object.entries(cart).map(([cartKey, info]) => ({
    cartKey,
    ...info
  }));

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
        name: item.variant ? `${item.name} (${item.variant})` : item.name,
        price: item.price,
        quantity: item.quantity,
        remark: item.remark || '',
        variant: item.variant || ''
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

  // Filter menu by category AND search query
  const filteredMenu = menu.filter(item => {
    if (!item.isAvailable) return false;
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Security Block: Only shown when a token IS present but is wrong (URL tampering).
  // Missing token is handled by the auto-redirect useEffect above.
  if (!isTableValid) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#3C2F2F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#EFEAE4] rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 animate-bounce">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Security Alert: Invalid Table URL</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            This link appears to have been modified. The security token does not match the table number.
            Please scan the QR code physically printed on your table to place a valid order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3C2F2F] pb-36 relative overflow-hidden">
      
      {/* Subtle warm backdrop blobs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#F7ECE6]/60 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#EFEAE4]/40 blur-3xl rounded-full pointer-events-none"></div>

      {/* Premium Floating Coffee Shop Header */}
      <div className="px-4 pt-4 sticky top-0 z-30 no-print">
        <header className="bg-white/90 backdrop-blur-md border border-[#EFEAE4] py-3.5 px-5 rounded-2xl shadow-sm max-w-4xl mx-auto flex flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] rounded-full flex items-center justify-center font-bold text-sm shadow-inner font-mono">
              ☕
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-wide text-[#3C2F2F] font-sans">
                  Cafe
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-green-50 text-green-700 border border-green-100">
                  Online
                </span>
              </div>
              <p className="text-[9px] text-[#7C6C6C] font-semibold tracking-wider">Order System</p>
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

        {/* Customer Menu Search Bar */}
        <section className="bg-white border border-[#EFEAE4] rounded-3xl p-4 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-[#7C6C6C]" />
          <input
            type="text"
            placeholder="Search food, drinks, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[#3C2F2F] text-sm focus:outline-none placeholder:text-[#7C6C6C]/60"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="text-[#7C6C6C] hover:text-[#3C2F2F]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
              {['All', ...categories].map((cat) => (
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

          {/* Menu Items Grid */}
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
              {filteredMenu.map((item) => {
                const activeVariant = itemVariants[item.id] || '';
                const cartKey = activeVariant ? `${item.id}_${activeVariant}` : item.id;
                const quantityInCart = cart[cartKey]?.quantity || 0;

                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantity={quantityInCart}
                    selectedVariant={activeVariant}
                    setSelectedVariant={(varName) => setItemVariants(prev => ({ ...prev, [item.id]: varName }))}
                    onQuantityChange={(qty, selectedVar) => {
                      const cKey = selectedVar ? `${item.id}_${selectedVar}` : item.id;
                      handleQuantityChange(cKey, qty, selectedVar, item);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Checkout Drawer Summary Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 bg-white border border-[#EFEAE4] px-5 py-4 rounded-3xl shadow-xl animate-slide-up no-print max-w-4xl mx-auto">
          <div className="flex flex-row items-center justify-between gap-4">
            
            {/* Summary info triggers sliding cart details */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3.5 w-auto text-left hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
            >
              <div className="relative p-2.5 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] rounded-2xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#A87C5C] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse font-mono">
                  {totalCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#7C6C6C] font-bold uppercase tracking-wider">Review Order</p>
                <p className="text-base font-black text-[#3C2F2F] font-mono leading-none">Rs. {totalAmount}</p>
              </div>
            </button>

            {/* Place Order CTA Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-8 py-3 bg-[#3C2F2F] hover:bg-[#4E3629] active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-2 min-h-[44px]"
            >
              Review & Place Order
            </button>

          </div>
        </div>
      )}

      {/* Sliding Cart Modal Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white border border-[#EFEAE4] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#EFEAE4] bg-[#FAF7F2]/40">
              <div className="flex items-center gap-2 text-[#3C2F2F]">
                <CookingPot className="w-5 h-5 text-[#A87C5C]" />
                <h3 className="text-base sm:text-lg font-black font-sans">Your Selected Items</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-[#7C6C6C] hover:text-[#3C2F2F] p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.cartKey} className="border border-[#EFEAE4] rounded-2xl p-4 bg-white shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-extrabold text-[#3C2F2F] text-sm leading-snug">{item.name}</div>
                      {item.variant && (
                        <span className="inline-block text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md mt-1 font-sans">
                          {item.variant}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#3C2F2F] text-xs">Rs. {item.price * item.quantity}</div>
                      <span className="text-[10px] text-[#7C6C6C] font-mono">({item.quantity} x Rs.{item.price})</span>
                    </div>
                  </div>

                  {/* Quantity and Remark Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#EFEAE4]/60">
                    
                    {/* Cooking instructions note input */}
                    <div className="flex items-center gap-2 bg-[#FAF7F2]/60 px-3 py-1.5 border border-[#EFEAE4] rounded-xl flex-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#7C6C6C]" />
                      <input
                        type="text"
                        placeholder="Cooking instruction (e.g. less spicy, sugar...)"
                        value={item.remark}
                        onChange={(e) => handleRemarkChange(item.cartKey, e.target.value)}
                        className="bg-transparent text-xs text-[#3C2F2F] focus:outline-none placeholder:text-[#7C6C6C]/50 w-full"
                      />
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between bg-[#F7ECE6] border border-[#EFEAE4] p-0.5 rounded-full shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.cartKey, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-white hover:bg-[#FAF7F2] text-[#3C2F2F] flex items-center justify-center border border-[#EFEAE4] cursor-pointer shadow-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-black text-[#3C2F2F] font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.cartKey, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                        className="w-7 h-7 rounded-full bg-white hover:bg-[#FAF7F2] text-[#3C2F2F] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center border border-[#EFEAE4] cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Section */}
            <div className="border-t border-[#EFEAE4] bg-[#FAF7F2]/40 p-6 space-y-4">
              <div className="flex justify-between items-center text-[#3C2F2F]">
                <div>
                  <span className="block text-[10px] text-[#7C6C6C] font-bold uppercase tracking-wider">Grand Total</span>
                  <span className="text-xl sm:text-2xl font-black text-[#A87C5C] font-mono">Rs. {totalAmount}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-[#7C6C6C] font-bold uppercase tracking-wider">Active Table</span>
                  <span className="text-sm font-extrabold text-[#3C2F2F]">Table {tableNum}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !customerName.trim()}
                className="w-full py-3.5 bg-[#3C2F2F] hover:bg-[#4E3629] active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-2 min-h-[46px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Placing Order...
                  </>
                ) : (
                  `Confirm & Send Order (Rs. ${totalAmount})`
                )}
              </button>

              {!customerName.trim() && (
                <p className="text-[10px] text-red-550 text-center font-bold">
                  * Please enter your name in the customer details box first.
                </p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// Helper icons (avoids extra import)
const Minus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default OrderPage;
