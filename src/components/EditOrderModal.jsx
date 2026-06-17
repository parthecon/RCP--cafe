import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Search, MessageSquare, PackagePlus, Save } from 'lucide-react';
import useMenu from '../hooks/useMenu';
import toast from 'react-hot-toast';

/**
 * EditOrderModal — admin modal to modify items, quantities,
 * and cooking remarks on an existing live order.
 */
export const EditOrderModal = ({ order, onClose, onSave }) => {
  const { menu, loading: menuLoading } = useMenu();
  const [items, setItems] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialise editable items from the existing order
  useEffect(() => {
    if (order?.items) {
      setItems(order.items.map(it => ({ ...it })));
    }
  }, [order]);

  const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  /* ── Item quantity helpers ── */
  const changeQty = (idx, delta) => {
    setItems(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else if (newQty > 10) {
        toast.error('Max 10 per item');
      } else {
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return next;
    });
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const changeRemark = (idx, remark) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], remark };
      return next;
    });
  };

  /* ── Add item from menu ── */
  const addMenuItemToOrder = (menuItem, variantName = null) => {
    const price = variantName
      ? (menuItem.variants?.find(v => v.name === variantName)?.price ?? menuItem.price)
      : menuItem.price;
    const displayName = variantName ? `${menuItem.name} (${variantName})` : menuItem.name;

    setItems(prev => {
      // if it already exists, just bump qty
      const existIdx = prev.findIndex(it => it.name === displayName);
      if (existIdx >= 0) {
        const next = [...prev];
        next[existIdx] = { ...next[existIdx], quantity: Math.min(10, next[existIdx].quantity + 1) };
        return next;
      }
      return [...prev, { id: menuItem.id, name: displayName, price, quantity: 1, remark: '', variant: variantName || '' }];
    });
    toast.success(`Added ${displayName}`);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Order must have at least one item');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(order.id, items, totalAmount);
      toast.success('Order updated!');
      onClose();
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Filtered menu for add-item panel ── */
  const filteredMenu = menu.filter(m =>
    m.isAvailable &&
    m.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-[#EFEAE4] animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFEAE4] bg-[#FAF7F2] shrink-0">
          <div>
            <p className="text-[10px] font-bold text-[#7C6C6C] uppercase tracking-wider">Edit Order</p>
            <h3 className="text-sm font-black text-[#3C2F2F]">
              #{order.id} · {order.customerName} · Table {order.tableNumber}
            </h3>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-[#7C6C6C] hover:text-[#3C2F2F] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Current Items */}
          {items.length === 0 ? (
            <p className="text-center text-sm text-[#7C6C6C] py-6">No items. Add some from the menu below.</p>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="border border-[#EFEAE4] rounded-2xl p-3.5 bg-white shadow-sm space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-[#3C2F2F] text-sm leading-snug">{item.name}</p>
                    {item.variant && (
                      <span className="inline-block text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md mt-0.5">
                        {item.variant}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-[#3C2F2F] text-xs">Rs. {item.price * item.quantity}</p>
                    <p className="text-[10px] text-[#7C6C6C] font-mono">({item.quantity} × Rs.{item.price})</p>
                  </div>
                </div>

                {/* Remark input */}
                <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 border border-[#EFEAE4] rounded-xl">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7C6C6C] shrink-0" />
                  <input
                    type="text"
                    placeholder="Cooking instruction..."
                    value={item.remark || ''}
                    onChange={e => changeRemark(idx, e.target.value)}
                    className="bg-transparent text-xs text-[#3C2F2F] focus:outline-none placeholder:text-[#7C6C6C]/50 w-full"
                  />
                </div>

                {/* Qty row */}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => removeItem(idx)}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                  <div className="flex items-center bg-[#F7ECE6] border border-[#EFEAE4] p-0.5 rounded-full">
                    <button type="button" onClick={() => changeQty(idx, -1)}
                      className="w-7 h-7 rounded-full bg-white hover:bg-[#FAF7F2] text-[#3C2F2F] flex items-center justify-center border border-[#EFEAE4] cursor-pointer shadow-sm">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-black text-[#3C2F2F] font-mono">{item.quantity}</span>
                    <button type="button" onClick={() => changeQty(idx, 1)}
                      disabled={item.quantity >= 10}
                      className="w-7 h-7 rounded-full bg-white hover:bg-[#FAF7F2] text-[#3C2F2F] disabled:opacity-30 flex items-center justify-center border border-[#EFEAE4] cursor-pointer shadow-sm">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Items Toggle */}
          <button type="button"
            onClick={() => setIsAddingItems(v => !v)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-[#A87C5C]/40 text-[#A87C5C] text-xs font-bold hover:bg-[#F7ECE6]/40 transition-all cursor-pointer">
            <PackagePlus className="w-4 h-4" />
            {isAddingItems ? 'Hide Menu' : '+ Add Item from Menu'}
          </button>

          {/* Add Item Panel */}
          {isAddingItems && (
            <div className="bg-[#FAF7F2] border border-[#EFEAE4] rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#EFEAE4]">
                <Search className="w-4 h-4 text-[#7C6C6C]" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                  className="bg-transparent text-sm text-[#3C2F2F] focus:outline-none placeholder:text-[#7C6C6C]/50 w-full"
                />
              </div>

              {menuLoading ? (
                <p className="text-center text-xs text-[#7C6C6C] py-3">Loading menu...</p>
              ) : filteredMenu.length === 0 ? (
                <p className="text-center text-xs text-[#7C6C6C] py-3">No items match your search.</p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {filteredMenu.map(menuItem => (
                    <div key={menuItem.id} className="bg-white border border-[#EFEAE4] rounded-xl px-3 py-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-[#3C2F2F] text-sm">{menuItem.name}</p>
                          <p className="text-[10px] text-[#7C6C6C]">{menuItem.category} · Rs. {menuItem.price}</p>
                        </div>
                        {/* Regular / no-variant button — always shown */}
                        <button type="button"
                          onClick={() => addMenuItemToOrder(menuItem, null)}
                          className="px-2 py-1 bg-[#F7ECE6] border border-[#EFEAE4] text-[#A87C5C] text-[10px] font-bold rounded-lg hover:bg-[#EFEAE4] cursor-pointer transition-colors shrink-0">
                          Regular (Rs.{menuItem.price})
                        </button>
                      </div>
                      {/* Variant buttons row — only shown if variants exist */}
                      {menuItem.variants && menuItem.variants.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-[#EFEAE4]/60">
                          {menuItem.variants.map(v => (
                            <button key={v.name} type="button"
                              onClick={() => addMenuItemToOrder(menuItem, v.name)}
                              className="px-2 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold rounded-lg hover:bg-teal-100 cursor-pointer transition-colors">
                              {v.name} (Rs.{v.price})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#EFEAE4] bg-[#FAF7F2]/60 p-4 space-y-3 shrink-0">
          <div className="flex justify-between items-center text-[#3C2F2F]">
            <span className="text-xs text-[#7C6C6C] font-bold uppercase tracking-wider">Updated Total</span>
            <span className="text-xl font-black text-[#A87C5C] font-mono">Rs. {totalAmount}</span>
          </div>
          <button type="button" onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="w-full py-3.5 bg-[#3C2F2F] hover:bg-[#4E3629] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex justify-center items-center gap-2 min-h-[46px]">
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4" />Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
