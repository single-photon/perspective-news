import React from 'react';
import { NewsItem, NewsStyle } from '../types';

interface NewsCardProps {
  story: NewsItem;
  style: NewsStyle;
  index: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ story, style, index }) => {
  const isFiction = style === NewsStyle.FICTION;
  const isSatire = style === NewsStyle.SATIRE;

  return (
    <div className={`
      flex flex-col h-full bg-[#FDFBF7] p-4 md:p-6 transition-all duration-300
      border-slate-300
      
      /* Mobile: Bottom border on all except last */
      border-b-2 last:border-b-0 

      /* Desktop: Reset mobile borders first */
      md:border-b-0 md:last:border-b-0

      /* Desktop Grid Logic (3 cols) */
      /* Right border on 1st and 2nd columns */
      md:[&:nth-child(3n+1)]:border-r-2 
      md:[&:nth-child(3n+2)]:border-r-2
      md:[&:nth-child(3n)]:border-r-0

      /* Bottom border on the first row (assuming 6 items total, first 3 get bottom border) */
      md:[&:nth-child(-n+3)]:border-b-2
    `}>

      <div className="mb-4 border-b border-slate-800 pb-2 flex justify-between items-end">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
          Column {index + 1}
        </span>
        <span className="text-[10px] font-serif italic text-slate-500">
          {story.originalSource}
        </span>
      </div>

      <h3 className={`text-2xl md:text-3xl font-bold mb-4 leading-tight serif text-black ${isSatire ? 'italic' : ''}`}>
        {story.headline}
      </h3>

      <div className={`flex-1 text-slate-800 text-sm md:text-base leading-relaxed font-serif text-justify mb-6 ${isFiction ? 'italic' : ''}`}>
        {story.content}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
          {style}
        </span>
        {story.sourceUrl && (
          <a
            href={story.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-wider font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            Read Original Source
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

export default NewsCard;