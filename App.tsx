import React, { useState, useEffect, useRef } from 'react';
import { NewsItem, NewsStyle, LoadingState } from './types';
import StyleSelector from './components/StyleSelector';
import NewsCard from './components/NewsCard';

const App: React.FC = () => {
  const [allStories, setAllStories] = useState<Record<string, NewsItem[]>>({});
  const [displayStories, setDisplayStories] = useState<NewsItem[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<NewsStyle>(NewsStyle.NEUTRAL);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadStaticNews();
  }, []);

  const loadStaticNews = async () => {
    setLoadingState('fetching-news');
    try {
      const response = await fetch('/news-data.json');
      if (!response.ok) throw new Error("Failed to load news data");

      const data = await response.json();

      if (!data.stories || !data.stories[NewsStyle.NEUTRAL]) {
        throw new Error("Invalid news data format");
      }

      setAllStories(data.stories);
      setDisplayStories(data.stories[NewsStyle.NEUTRAL]);
      setLastUpdated(data.timestamp);
      setLoadingState('success');
    } catch (err: any) {
      console.error("Failed to load static news:", err);
      setError("Failed to load today's edition. Please try again later.");
      setLoadingState('error');
    }
  };

  const handleStyleChange = (newStyle: NewsStyle) => {
    setSelectedStyle(newStyle);
    if (allStories[newStyle]) {
      setDisplayStories(allStories[newStyle]);
    } else {
      // Fallback if style missing
      setDisplayStories(allStories[NewsStyle.NEUTRAL] || []);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans text-slate-900 pb-20 border-t-8 border-black">

      {/* Vintage Masthead */}
      <header className="py-6 px-4 text-center border-b-4 border-black mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="border-b border-black pb-2 mb-4 flex justify-center items-center">
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500">
              {today}
            </p>
          </div>

          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-black uppercase serif leading-none mb-3">
            Perspective News
          </h1>

          <p className="text-sm font-serif text-slate-700 italic max-w-2xl mx-auto mt-2">
            Choose your narrative lens below to rewrite today's headlines.
          </p>
        </div>
      </header>

      <main className="px-4 max-w-7xl mx-auto">
        {/* Style Selector */}
        <div className="sticky top-0 z-30 bg-[#fdfbf7]/95 backdrop-blur-sm pt-2 pb-4 border-b-2 border-black mb-8">
          <StyleSelector
            currentStyle={selectedStyle}
            onSelect={handleStyleChange}
            disabled={loadingState !== 'success'}
          />
        </div>

        {/* Loading State */}
        {loadingState === 'fetching-news' && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-slate-300 border-t-black rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-serif font-bold text-black">Fetching Edition...</h3>
          </div>
        )}

        {/* Error State */}
        {loadingState === 'error' && (
          <div className="flex justify-center py-10">
            <div className="max-w-2xl w-full bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b-2 border-black pb-3 mb-4 text-center">
                <h3 className="text-2xl font-black text-black font-serif uppercase">Notice: Print Error</h3>
              </div>
              <p className="text-red-900 font-bold mb-2 text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {loadingState === 'success' && (
          <div className="grid grid-cols-1 md:grid-cols-3 border-t-2 border-slate-800 bg-white shadow-sm">
            {displayStories.map((story, index) => (
              <NewsCard
                key={story.id}
                story={story}
                style={selectedStyle}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer with Last Updated */}
      {lastUpdated && (
        <footer className="py-4 px-4 text-center border-t-2 border-black mt-8">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Last Updated: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </footer>
      )}
    </div>
  );
};

export default App;