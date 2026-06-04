import React from 'react';
import { Plus, Minus, Coffee, UtensilsCrossed, Cookie } from 'lucide-react';

export const MenuCard = ({ item, quantity, onQuantityChange }) => {
  const { name, category, price, description, isAvailable } = item;

  const getCategoryIcon = (size = "w-5 h-5") => {
    switch (category) {
      case 'Drinks':
        return <Coffee className={`${size} text-[#A87C5C]`} />;
      case 'Food':
        return <UtensilsCrossed className={`${size} text-[#C05C3E]`} />;
      case 'Snacks':
      default:
        return <Cookie className={`${size} text-[#A58252]`} />;
    }
  };

  const getGradientClass = () => {
    switch (category) {
      case 'Drinks':
        return 'bg-[#F7ECE6] border-[#F2DFD5]';
      case 'Food':
        return 'bg-[#FBF1EC] border-[#F4E3D9]';
      case 'Snacks':
      default:
        return 'bg-[#FAF1E6] border-[#F2E5D5]';
    }
  };

  if (!isAvailable) return null;

  const inCart = quantity > 0;

  return (
    <div className={`group relative bg-white border rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
      inCart ? 'border-[#A87C5C] shadow-sm shadow-[#A87C5C]/5' : 'border-[#EFEAE4] shadow-sm'
    }`}>
      <div>
        {/* Category specific banner */}
        <div className={`h-28 w-full rounded-2xl border ${getGradientClass()} flex items-center justify-center relative overflow-hidden mb-3.5`}>
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10 blur-md"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10 blur-lg"></div>
          
          <div className="p-3 bg-white border border-[#EFEAE4]/40 rounded-full shadow-sm transform group-hover:scale-105 transition-transform duration-300">
            {getCategoryIcon("w-5 h-5 sm:w-6 sm:h-6")}
          </div>
        </div>

        {/* Name and Price */}
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-extrabold text-[#3C2F2F] text-sm sm:text-base leading-snug group-hover:text-[#A87C5C] transition-colors line-clamp-1">
            {name}
          </h3>
          <span className="text-xs sm:text-sm font-black text-[#3C2F2F] shrink-0 font-mono">
            Rs. {price}
          </span>
        </div>

        {/* Category Pill */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#FAF7F2] border border-[#EFEAE4] text-[#7C6C6C]">
            {category}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-[#7C6C6C] text-[11px] sm:text-xs leading-relaxed mb-3 line-clamp-2 min-h-[32px]">
            {description}
          </p>
        )}
      </div>

      {/* Cart Control */}
      <div className="pt-2.5 border-t border-[#EFEAE4]/60 flex justify-between items-center mt-auto w-full">
        {quantity === 0 ? (
          <>
            <span className="text-[9px] font-semibold text-[#7C6C6C] uppercase tracking-wider">
              Add to Order
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(1)}
              className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#F7ECE6] hover:text-[#A87C5C] text-[#3C2F2F] border border-[#EFEAE4] hover:border-[#A87C5C]/30 active:scale-90 flex items-center justify-center transition-all cursor-pointer shadow-sm min-h-[36px] min-w-[36px]"
              aria-label="Add to cart"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#3C2F2F]" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full bg-[#F7ECE6] border border-[#EFEAE4] p-0.5 rounded-full shadow-inner">
            <button
              type="button"
              onClick={() => onQuantityChange(quantity - 1)}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#FAF7F2] text-[#3C2F2F] hover:text-[#A87C5C] active:scale-90 flex items-center justify-center transition-all border border-[#EFEAE4] cursor-pointer shadow-sm min-h-[32px] min-w-[32px]"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] sm:text-xs font-black text-[#3C2F2F] uppercase tracking-wider">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={quantity >= 10}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#FAF7F2] text-[#3C2F2F] hover:text-[#A87C5C] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 flex items-center justify-center transition-all border border-[#EFEAE4] cursor-pointer shadow-sm min-h-[32px] min-w-[32px]"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
