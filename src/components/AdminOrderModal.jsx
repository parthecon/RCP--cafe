import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Search, ShoppingCart, User, Sparkles, ChefHat, MessageSquare, CookingPot } from 'lucide-react';
import useMenu from '../hooks/useMenu';
import { subscribeToCategories } from '../firebase/dbService';
import toast from 'react-hot-toast';

/**
 * AdminOrderModal — lets the admin place a brand-new order
 * for any table directly from the dashboard.
 */
export const AdminOrderModal = ({ onClose, onSubmit }) => {
  const { menu, loading: menuLoading } = useMenu();
  const [categories, setCategories] = useState([]);
  const [tableNum, setTableNum] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState({}); // { itemKey: { id, name, price, quantity, remark, variant } }
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCategories(setCategories);
    return () => typeof unsub === 'function' && unsub();
  }, []);

  /* ── Computed ── */
  const cartItems = Object.entries(cart).map(([k, v]) => ({ cartKey: k, ...v }));
  const totalAmount = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const totalCount = cartItems.reduce((s, it) => s + it.quantity, 0);

  const filteredMenu = menu.filter(item => {
    if (!item.isAvailable) return false;
    const catOk = activeCategory === 'All' || item.category === activeCategory;
    const searchOk = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catOk && searchOk;
  });

  /* ── Cart helpers ── */
  const addItem = (menuItem, variantName = null) => {
    const price = variantName
      ? (menuItem.variants?.find(v => v.name === variantName)?.price ?? menuItem.price)
      : menuItem.price;
    const cartKey = variantName ? `${menuItem.id}_${variantName}` : menuItem.id;
    const displayName = variantName ? `${menuItem.name} (${variantName})` : menuItem.name;

    setCart(prev => {
      const existing = prev[cartKey];
      if (existing) {
        if (existing.quantity >= 10) { toast.error('Max 10 per item'); return prev; }
        return { ...prev, [cartKey]: { ...existing, quantity: existing.quantity + 1 } };
      }
      return {
        ...prev,
        [cartKey]: { id: menuItem.id, name: displayName, price, quantity: 1, remark: '', variant: variantName || '' }
      };
    });
  };

  const changeQty = (cartKey, delta) => {
    setCart(prev => {
      const item = prev[cartKey];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const { [cartKey]: _, ...rest } = prev;
        return rest;
      }
      if (newQty > 10) { toast.error('Max 10 per item'); return prev; }
      return { ...prev, [cartKey]: { ...item, quantity: newQty } };
    });
  };

  const changeRemark = (cartKey, remark) => {
    setCart(prev => prev[cartKey] ? { ...prev, [cartKey]: { ...prev[cartKey], remark } } : prev);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error('Please enter a customer name'); return; }
    if (cartItems.length === 0) { toast.error('Cart is empty'); return; }
    const tableNumber = parseInt(tableNum, 10);
    if (!tableNumber || tableNumber < 1) { toast.error('Invalid table number'); return; }

    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        tableNumber,
        items: cartItems.map(it => ({
          id: it.id, name: it.name, price: it.price,
          quantity: it.quantity, remark: it.remark || '', variant: it.variant || ''
        })),
        totalAmount
      });
      toast.success(`Order placed for Table ${tableNumber}`);
      onClose();
    } catch {
      toast.error('Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-2 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden border border-[#EFEAE4] animate-slide-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFEAE4] bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#A87C5C]" />
            <div>
              <p className="text-[10px] font-bold text-[#7C6C6C] uppercase tracking-wider">Admin Panel</p>
              <h3 className="text-sm font-black text-[#3C2F2F]">Place New Order</h3>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-[#7C6C6C] hover:text-[#3C2F2F] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Table + Customer row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7C6C6C] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Table Number
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={tableNum}
                onChange={e => setTableNum(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAF7F2] border border-[#EFEAE4] focus:border-[#A87C5C] rounded-xl text-[#3C2F2F] text-sm font-bold focus:outline-none transition-colors font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7C6C6C] uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Customer Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAF7F2] border border-[#EFEAE4] focus:border-[#A87C5C] rounded-xl text-[#3C2F2F] text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EFEAE4] px-3 py-2.5 rounded-2xl">
            <Search className="w-4 h-4 text-[#7C6C6C] shrink-0" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#3C2F2F] focus:outline-none placeholder:text-[#7C6C6C]/50 w-full"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#3C2F2F] text-white shadow-sm'
                    : 'bg-[#EFEAE4]/60 text-[#7C6C6C] hover:text-[#3C2F2F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          {menuLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#A87C5C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMenu.length === 0 ? (
            <p className="text-center text-sm text-[#7C6C6C] py-8">No items found.</p>
          ) : (
            <div className="space-y-2">
              {filteredMenu.map(menuItem => {
                const hasVariants = menuItem.variants && menuItem.variants.length > 0;
                return (
                  <div key={menuItem.id} className="bg-[#FAF7F2] border border-[#EFEAE4] rounded-2xl px-3.5 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#3C2F2F] text-sm truncate">{menuItem.name}</p>
                        <p className="text-[10px] text-[#7C6C6C]">{menuItem.category} · Rs. {menuItem.price}</p>
                      </div>
                      {/* Regular (base price) — always shown */}
                      <div className="flex items-center gap-1 shrink-0">
                        {cart[menuItem.id]?.quantity > 0 ? (
                          <div className="flex items-center bg-[#F7ECE6] border border-[#EFEAE4] p-0.5 rounded-full">
                            <button type="button" onClick={() => changeQty(menuItem.id, -1)}
                              className="w-6 h-6 rounded-full bg-white border border-[#EFEAE4] text-[#3C2F2F] flex items-center justify-center cursor-pointer">
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="px-2 text-xs font-black text-[#3C2F2F] font-mono">{cart[menuItem.id].quantity}</span>
                            <button type="button" onClick={() => addItem(menuItem, null)}
                              className="w-6 h-6 rounded-full bg-white border border-[#EFEAE4] text-[#3C2F2F] flex items-center justify-center cursor-pointer">
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => addItem(menuItem, null)}
                            className="px-2 py-1 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] text-[10px] font-bold rounded-lg hover:bg-[#EFEAE4] cursor-pointer transition-colors">
                            Regular (Rs.{menuItem.price}) <Plus className="w-2.5 h-2.5 inline ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Variant buttons — shown below if item has variants */}
                    {hasVariants && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-[#EFEAE4]/60">
                        {menuItem.variants.map(v => {
                          const cartKey = `${menuItem.id}_${v.name}`;
                          const qty = cart[cartKey]?.quantity || 0;
                          return (
                            <div key={v.name} className="flex items-center gap-1">
                              {qty > 0 && (
                                <button type="button" onClick={() => changeQty(cartKey, -1)}
                                  className="w-6 h-6 rounded-full bg-white border border-teal-100 text-teal-700 flex items-center justify-center cursor-pointer hover:bg-teal-50">
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {qty > 0 && <span className="text-xs font-black text-teal-700 font-mono w-4 text-center">{qty}</span>}
                              <button type="button" onClick={() => addItem(menuItem, v.name)}
                                className="px-2 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold rounded-lg hover:bg-teal-100 cursor-pointer transition-colors">
                                {v.name} (Rs.{v.price})
                                {qty === 0 && <Plus className="w-2.5 h-2.5 inline ml-1" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!hasVariants && (
                      <div className="flex items-center gap-2 shrink-0">
                        {cart[menuItem.id]?.quantity > 0 ? (
                          <div className="flex items-center bg-[#F7ECE6] border border-[#EFEAE4] p-0.5 rounded-full">
                            <button type="button" onClick={() => changeQty(menuItem.id, -1)}
                              className="w-7 h-7 rounded-full bg-white border border-[#EFEAE4] text-[#3C2F2F] flex items-center justify-center cursor-pointer">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-black text-[#3C2F2F] font-mono">{cart[menuItem.id].quantity}</span>
                            <button type="button" onClick={() => addItem(menuItem)}
                              className="w-7 h-7 rounded-full bg-white border border-[#EFEAE4] text-[#3C2F2F] flex items-center justify-center cursor-pointer">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => addItem(menuItem)}
                            className="w-8 h-8 rounded-full bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] hover:bg-[#EFEAE4] flex items-center justify-center transition-all cursor-pointer">
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Bar */}
        {totalCount > 0 && !isCartOpen && (
          <div className="border-t border-[#EFEAE4] bg-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <button type="button" onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="relative p-2 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] rounded-xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#A87C5C] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {totalCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#7C6C6C] font-bold uppercase tracking-wider">Cart</p>
                <p className="text-sm font-black text-[#3C2F2F] font-mono leading-none">Rs. {totalAmount}</p>
              </div>
            </button>
            <button type="button" onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-[#3C2F2F] hover:bg-[#4E3629] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer">
              Review & Place
            </button>
          </div>
        )}

        {/* Cart Review Panel */}
        {isCartOpen && (
          <div className="border-t border-[#EFEAE4] bg-white flex flex-col shrink-0 max-h-[55vh]">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFEAE4] bg-[#FAF7F2]">
              <div className="flex items-center gap-2 text-[#3C2F2F]">
                <CookingPot className="w-4 h-4 text-[#A87C5C]" />
                <span className="text-sm font-black">Order Summary</span>
              </div>
              <button type="button" onClick={() => setIsCartOpen(false)}
                className="text-[#7C6C6C] hover:text-[#3C2F2F] p-1 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cartItems.map(item => (
                <div key={item.cartKey} className="border border-[#EFEAE4] rounded-xl p-3 bg-white space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[#3C2F2F] text-sm">{item.name}</p>
                      {item.variant && (
                        <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
                          {item.variant}
                        </span>
                      )}
                    </div>
                    <p className="font-mono font-bold text-[#3C2F2F] text-xs">Rs. {item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-2 py-1 border border-[#EFEAE4] rounded-lg flex-1">
                      <MessageSquare className="w-3 h-3 text-[#7C6C6C] shrink-0" />
                      <input
                        type="text"
                        placeholder="Cooking instruction..."
                        value={item.remark || ''}
                        onChange={e => changeRemark(item.cartKey, e.target.value)}
                        className="bg-transparent text-xs text-[#3C2F2F] focus:outline-none placeholder:text-[#7C6C6C]/50 w-full"
                      />
                    </div>
                    <div className="flex items-center bg-[#F7ECE6] border border-[#EFEAE4] p-0.5 rounded-full shrink-0">
                      <button type="button" onClick={() => changeQty(item.cartKey, -1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#EFEAE4] text-[#3C2F2F] flex items-center justify-center cursor-pointer">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-2 text-xs font-black text-[#3C2F2F] font-mono">{item.quantity}</span>
                      <button type="button" onClick={() => changeQty(item.cartKey, 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#EFEAE4] text-[#3C2F2F] flex items-center justify-center cursor-pointer">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="p-3 border-t border-[#EFEAE4] space-y-2.5">
              <div className="flex justify-between text-[#3C2F2F]">
                <span className="text-xs text-[#7C6C6C] font-bold uppercase">Grand Total</span>
                <span className="text-lg font-black text-[#A87C5C] font-mono">Rs. {totalAmount}</span>
              </div>
              <button type="button" onClick={handleSubmit}
                disabled={isSubmitting || !customerName.trim()}
                className="w-full py-3 bg-[#3C2F2F] hover:bg-[#4E3629] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-2">
                {isSubmitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Placing...</>
                  : `Confirm Order for Table ${tableNum} (Rs. ${totalAmount})`
                }
              </button>
              {!customerName.trim() && (
                <p className="text-[10px] text-red-500 text-center font-bold">* Enter a customer name first</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderModal;
