import React from 'react';
import { NewsStyle } from '../types';
import { STYLE_CONFIG } from '../constants';

interface StyleSelectorProps {
  currentStyle: NewsStyle;
  onSelect: (style: NewsStyle) => void;
  disabled: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ currentStyle, onSelect, disabled }) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-3 gap-2 md:gap-0 md:flex md:justify-center md:items-stretch md:border-b-2 md:border-black/10 pb-1">
        {(Object.values(NewsStyle) as NewsStyle[]).map((style) => {
          const config = STYLE_CONFIG[style];
          const isSelected = currentStyle === style;
          
          return (
            <button
              key={style}
              onClick={() => onSelect(style)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-center p-2 transition-all duration-200
                min-h-[70px] md:min-h-[90px] md:w-32
                border border-slate-300 md:border-transparent md:border-b-4 
                rounded-sm md:rounded-none
                ${isSelected 
                  ? `bg-white md:bg-transparent border-slate-800 md:border-slate-800 shadow-sm md:shadow-none z-10` 
                  : 'bg-stone-50 md:bg-transparent border-stone-200 md:border-transparent hover:bg-white hover:border-stone-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Icon */}
              <div className={`mb-1 ${isSelected ? config.color : 'text-slate-400'} scale-75 origin-center`}>
                {config.icon}
              </div>
              
              {/* Label */}
              <span className={`text-[11px] md:text-xs font-bold uppercase tracking-wider text-center leading-none serif ${isSelected ? 'text-black' : 'text-slate-500'}`}>
                {style}
              </span>
              
              {/* Description */}
              <span className={`text-[9px] leading-none text-center mt-1 hidden xs:block font-serif italic ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                  {config.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StyleSelector;