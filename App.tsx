
import React, { useState, useEffect, useCallback } from 'react';
import { generateShortWittiHumorousAnswer } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';

const ShareOutIcon = ({ className = "w-5 h-5 mr-2 inline" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
    </svg>
);

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [currentQuip, setCurrentQuip] = useState<{ question: string; answer: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<{ message: string, id: string | null }>({ message: '', id: null });

  useEffect(() => {
    if (shareStatus.message) {
      const timer = setTimeout(() => {
        setShareStatus({ message: '', id: null });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shareStatus]);

  const handleFetchWittiQuip = useCallback(async (questionToAsk: string) => {
    if (!questionToAsk.trim()) {
      setError("Please enter a question to get a WITTI quip!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiKeyError(false);
    setCurrentQuip(null); 

    try {
      const result = await generateShortWittiHumorousAnswer(questionToAsk);
      setCurrentQuip({ question: questionToAsk, answer: result });
      setInputValue(''); // Clear input after successful fetch
    } catch (e: any) {
      console.error("Error fetching quip:", e);
      const errorMessage = e.message || 'Failed to get a quip. The muse of brevity is unavailable.';
      setError(errorMessage);
      if (errorMessage.toLowerCase().includes("api key") || errorMessage.toLowerCase().includes("api_key")) {
        setApiKeyError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleFetchWittiQuip(inputValue);
  };

  const handleShareQuip = async (question: string, content: string) => {
    const shareText = `Question: ${question}\n\nWITTI's Quick Quip:\n${content}`;
    const shareTitle = `WITTI: My WITTI Quip`;
    const uniqueId = question + '::' + content;

    setShareStatus({ message: '', id: null }); // Clear previous status

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        // setShareStatus({ message: 'Shared!', id: uniqueId });
      } catch (err: any) {
        console.error('Error using Web Share API:', err);
        if (err.name !== 'AbortError') {
             setShareStatus({ message: 'Share failed', id: uniqueId });
        }
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus({ message: 'Copied!', id: uniqueId });
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        setShareStatus({ message: 'Copy failed', id: uniqueId });
      }
    } else {
      setShareStatus({ message: 'Share N/A', id: uniqueId });
      console.warn('Web Share and Clipboard API not available.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <main className="bg-white shadow-xl md:shadow-2xl rounded-xl p-8 md:p-12 w-full max-w-2xl space-y-8 transform transition-all duration-500 ease-out">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 tracking-tight">
            WITTI
          </h1>
          <p className="text-slate-500 mt-3 text-sm md:text-base">
            Ask any question. Get a snappy, WITTI quip!
          </p>
        </header>

        {apiKeyError && (
          <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 p-4 rounded-md" role="alert">
            <p className="font-bold">API Key Configuration Error</p>
            <p>There seems to be an issue with the API Key. Please ensure it is correctly configured in the application's environment as <code>process.env.API_KEY</code>.</p>
          </div>
        )}

        {!apiKeyError && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="questionInput" className="block text-sm font-medium text-slate-700 mb-2">
                Your Question:
              </label>
              <textarea
                id="questionInput"
                rows={2} 
                className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out disabled:opacity-70 disabled:bg-slate-200 placeholder-slate-400 text-slate-800"
                placeholder="e.g., Why is the sky blue?"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                aria-label="Your Question Input"
              />
            </div>
            <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="w-full font-medium text-white py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 transform hover:scale-105 active:scale-95"
                >
                  {isLoading ? <LoadingSpinner colorClass="text-white"/> : 'Get WITTI Quip'}
                </button>
            </div>
          </form>
        )}
        
        {isLoading && !currentQuip && !error && (
          <div className="mt-8 flex flex-col items-center justify-center text-sky-600">
            <LoadingSpinner colorClass="text-sky-500" />
            <p className="mt-2 witti-pulse">Whipping up a WITTI one-liner...</p>
          </div>
        )}

        {error && !apiKeyError && (
          <div className="mt-6 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 p-4 rounded-md shadow" role="alert">
            <p className="font-bold">Oh dear, a quip hiccup!</p>
            <p>{error}</p>
          </div>
        )}

        {currentQuip && !error && ( 
          <section className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-sm animate-fadeInQuick">
            <h3 className="text-md font-semibold text-sky-400 mb-1">
              WITTI's Quip for: <span className="font-normal italic text-cyan-300">"{currentQuip.question}"</span>
            </h3>
            <p className="text-slate-100 text-lg py-2">{currentQuip.answer}</p>
            {!apiKeyError && (
                 <button
                    onClick={() => handleShareQuip(currentQuip.question, currentQuip.answer)}
                    disabled={isLoading || (shareStatus.message === 'Copied!' && shareStatus.id === currentQuip.question + '::' + currentQuip.answer)}
                    className="mt-3 w-full sm:w-auto text-sm font-medium py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center border border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900 transform hover:scale-105 active:scale-95"
                    aria-label="Share this quick quip"
                >
                    <ShareOutIcon className="w-4 h-4 mr-1.5 inline"/>
                    {shareStatus.id === currentQuip.question + '::' + currentQuip.answer ? shareStatus.message : 'Share Quip'}
                </button>
            )}
          </section>
        )}

      </main>
      <footer className="text-center mt-10 mb-6 text-sm text-indigo-300">
        <p>&copy; {new Date().getFullYear()} WITTI. All quips final (probably).</p>
      </footer>
       <style>{/* css */`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
         @keyframes fadeInQuick {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInQuick {
          animation: fadeInQuick 0.3s ease-out forwards;
        }
        .witti-pulse {
           animation: wittiPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes wittiPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default App;
