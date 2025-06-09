import React, { useState } from 'react';

interface PendingItem {
  id: string;
  title: string;
  language: string;
}

interface PushPanelProps {
  pending: PendingItem[];
  setPending: React.Dispatch<React.SetStateAction<PendingItem[]>>;
  onPushComplete: () => void;
}

const PushPanel: React.FC<PushPanelProps> = ({ pending, setPending, onPushComplete }) => {
  const [isPushing, setIsPushing] = useState(false);
  const [showToast, setShowToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const removePendingItem = (id: string) => {
    setPending(prev => prev.filter(item => item.id !== id));
  };

  const handlePush = async () => {
    if (pending.length === 0) return;
    
    setIsPushing(true);
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'push',
        items: pending
      });
      
      if (response && response.ok) {
        setPending([]);
        showToastMessage('success', `Successfully pushed ${pending.length} solution(s) to GitHub`);
        onPushComplete();
      } else {
        showToastMessage('error', response?.error || 'Failed to push to GitHub');
      }
    } catch (error) {
      console.error('Push failed:', error);
      showToastMessage('error', 'Failed to push to GitHub');
    } finally {
      setIsPushing(false);
    }
  };

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setShowToast({ type, message });
    setTimeout(() => setShowToast(null), 3000);
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'Python': 'bg-blue-100 text-blue-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'Java': 'bg-red-100 text-red-800',
      'C++': 'bg-purple-100 text-purple-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-orange-100 text-orange-800',
    };
    return colors[language] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          showToast.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {showToast.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Push Button */}
      <button
        onClick={handlePush}
        disabled={isPushing || pending.length === 0}
        className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          isPushing || pending.length === 0
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
        }`}
      >
        {isPushing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Pushing to GitHub...
          </div>
        ) : (
          `Push to GitHub (${pending.length})`
        )}
      </button>

      {/* Pending Items Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {pending.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-medium text-slate-900 mb-1">No pending solutions</h3>
            <p className="text-xs">Solutions you solve will appear here before pushing to GitHub</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-medium text-slate-900">Pending Solutions</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {pending.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLanguageColor(item.language)}`}>
                        {item.language}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removePendingItem(item.id)}
                    className="ml-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Remove from pending"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushPanel;