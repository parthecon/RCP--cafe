import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Coffee, UtensilsCrossed, Cookie, Eye, EyeOff, FolderOpen } from 'lucide-react';
import useMenu from '../hooks/useMenu';
import { subscribeToCategories, saveCategory, deleteCategory } from '../firebase/dbService';
import toast from 'react-hot-toast';

export const MenuCRUD = () => {
  const { menu, loading, error, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } = useMenu();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Categories states
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Variants state (array of { name, price })
  const [variants, setVariants] = useState([]);

  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // null for Add, object for Edit
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    price: '',
    description: '',
    isAvailable: true
  });

  // Load categories on mount
  useEffect(() => {
    const unsubscribe = subscribeToCategories((cats) => {
      setCategories(cats);
      // Set default category to the first one available, if any
      if (cats.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: prev.category && cats.includes(prev.category) ? prev.category : cats[0]
        }));
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const openAddModal = () => {
    setCurrentItem(null);
    setVariants([]);
    setFormData({
      name: '',
      category: categories[0] || 'Food',
      price: '',
      description: '',
      isAvailable: true
    });
    setIsOpen(true);
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setVariants(item.variants || []);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      isAvailable: item.isAvailable ?? true
    });
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      toast.error('Please enter a valid price (>= 0)');
      return;
    }

    const itemData = {
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description.trim(),
      isAvailable: formData.isAvailable,
      variants: variants
        .filter(v => v.name.trim() !== '')
        .map(v => ({ name: v.name.trim(), price: parseFloat(v.price) || 0 }))
    };

    try {
      if (currentItem) {
        await updateMenuItem({ ...itemData, id: currentItem.id });
        toast.success('Menu item updated successfully');
      } else {
        await addMenuItem(itemData);
        toast.success('Menu item added successfully');
      }
      setIsOpen(false);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMenuItem(id);
      toast.success('Menu item deleted');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete item');
    }
  };

  const handleToggle = async (id, currentVal) => {
    try {
      await toggleAvailability(id, !currentVal);
      toast.success(`Item is now ${!currentVal ? 'visible' : 'hidden'} to customers`);
    } catch (err) {
      toast.error('Failed to toggle availability');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Drinks':
        return <Coffee className="w-4.5 h-4.5 text-teal-600" />;
      case 'Food':
        return <UtensilsCrossed className="w-4.5 h-4.5 text-orange-550" />;
      case 'Snacks':
      default:
        return <Cookie className="w-4.5 h-4.5 text-amber-550" />;
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#7C6C6C]/60" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EFEAE4] focus:border-[#A87C5C] rounded-xl text-[#3C2F2F] text-sm focus:outline-none transition-colors shadow-sm"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C6C6C] hover:text-[#3C2F2F]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex bg-[#EFEAE4]/50 p-1 rounded-xl border border-[#EFEAE4] shadow-sm self-start overflow-x-auto max-w-full">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat 
                    ? 'bg-[#3C2F2F] text-white shadow-sm' 
                    : 'text-[#7C6C6C] hover:text-[#3C2F2F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#EFEAE4] hover:bg-slate-50 text-[#3C2F2F] font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex-1 sm:flex-initial justify-center min-h-[44px]"
          >
            <FolderOpen className="w-4 h-4 text-teal-655" />
            Manage Categories
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3C2F2F] hover:bg-[#4E3629] text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex-1 sm:flex-initial justify-center min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Grid or Table of Items */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredMenu.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
          <p className="text-slate-450 text-sm">No items found matching the filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards Layout */}
          <div className="space-y-4 md:hidden no-print">
            {filteredMenu.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-[#EFEAE4] rounded-3xl p-4.5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-2 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FAF7F2] border border-[#EFEAE4] rounded-xl">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#3C2F2F] text-sm sm:text-base leading-snug">{item.name}</div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold border mt-1.5 ${
                        item.category === 'Food' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        item.category === 'Drinks' ? 'bg-[#F7ECE6] text-[#A87C5C] border-[#EFEAE4]' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-[#3C2F2F] text-sm">Rs. {item.price}</div>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-[#7C6C6C] leading-relaxed mb-4 p-2.5 bg-[#FAF7F2]/60 border border-[#EFEAE4] rounded-2xl">
                    {item.description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-3.5 border-t border-[#EFEAE4] gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, item.isAvailable)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      item.isAvailable 
                        ? 'bg-[#F7ECE6] text-[#A87C5C] border-[#F2DFD5] hover:bg-[#F7ECE6]/80' 
                        : 'bg-[#FAF7F2] text-[#7C6C6C] border-[#EFEAE4] hover:bg-[#FAF7F2]/80'
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-[#A87C5C]" />
                        Available
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-[#7C6C6C]" />
                        Hidden
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F7ECE6] text-[#3C2F2F] hover:text-[#A87C5C] border border-[#EFEAE4] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-2.5 py-1.5 text-xs bg-red-500 hover:bg-red-650 text-white font-bold rounded-lg cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-red-50 hover:text-red-550 text-[#7C6C6C] border border-[#EFEAE4] cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table Layout */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-[#EFEAE4] bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-[#7C6C6C]">
              <thead className="bg-[#FAF7F2] text-xs font-semibold uppercase tracking-wider text-[#7C6C6C] border-b border-[#EFEAE4]">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE4]">
                {filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FAF7F2] border border-[#EFEAE4] rounded-lg">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#3C2F2F] text-base">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-[#7C6C6C]/85 mt-0.5 max-w-sm line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                        item.category === 'Food' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        item.category === 'Drinks' ? 'bg-[#F7ECE6] text-[#A87C5C] border-[#EFEAE4]' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[#3C2F2F] text-sm">
                      Rs. {item.price}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, item.isAvailable)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          item.isAvailable 
                            ? 'bg-[#F7ECE6] text-[#A87C5C] border-[#F2DFD5] hover:bg-[#F7ECE6]/80' 
                            : 'bg-[#FAF7F2] text-[#7C6C6C] border-[#EFEAE4] hover:bg-[#FAF7F2]/80'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Eye className="w-3.5 h-3.5 animate-pulse text-[#A87C5C]" />
                            Available
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-[#7C6C6C]" />
                            Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F7ECE6] text-[#3C2F2F] hover:text-[#A87C5C] transition-colors cursor-pointer border border-[#EFEAE4]"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-2.5 py-1 text-xs bg-red-500 hover:bg-red-650 text-white font-bold rounded cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-550 text-slate-400 border border-slate-200 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Modal (White Backdrop-blurred overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">
                {currentItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-450 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Bread Omelette"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-slate-850 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    min="0"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Variants / Sub-options
                  </span>
                  <button
                    type="button"
                    onClick={() => setVariants(prev => [...prev, { name: '', price: '' }])}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Variant
                  </button>
                </div>
                {variants.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {variants.map((v, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Name e.g. Peri Peri"
                          value={v.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants(prev => prev.map((item, i) => i === index ? { ...item, name: val } : item));
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={v.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants(prev => prev.map((item, i) => i === index ? { ...item, price: val } : item));
                          }}
                          className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                          min="0"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setVariants(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-650 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Short description of ingredients or taste..."
                  rows="3"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="block text-sm font-bold text-slate-800">Available for Orders</span>
                  <span className="block text-xs text-slate-400">Show this item on customer order page</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer text-center border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-teal-500 hover:bg-teal-655 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/10 active:scale-98 transition-all cursor-pointer text-center"
                >
                  {currentItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Manage Categories</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-450 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Category */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newCategoryName.trim()) return;
                  try {
                    await saveCategory(newCategoryName.trim());
                    setNewCategoryName('');
                    toast.success('Category added successfully');
                  } catch (err) {
                    toast.error('Failed to add category');
                  }
                }}
                className="px-4 py-2.5 bg-[#3C2F2F] hover:bg-[#4E3629] text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Categories List */}
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat} className="flex justify-between items-center px-4 py-3 bg-white">
                  <span className="text-sm font-bold text-slate-800">{cat}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete category "${cat}"? This will not affect items under it but will remove it from the filters.`)) {
                        try {
                          await deleteCategory(cat);
                          toast.success('Category deleted');
                        } catch (err) {
                          toast.error('Failed to delete category');
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-650 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCRUD;
