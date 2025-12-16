import React, { useEffect, useState } from 'react';
import { registerDialogHandler } from '../../utils/dialogService';

export default function DialogProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState({ type: null, message: '', resolve: null, defaultValue: '' });
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    registerDialogHandler(({ type, message, resolve, defaultValue }) => {
      setPayload({ type, message, resolve, defaultValue });
      setPromptValue(defaultValue || '');
      setOpen(true);
    });
  }, []);

  const close = (result) => {
    setOpen(false);
    if (payload.resolve) payload.resolve(result);
    setPayload({ type: null, message: '', resolve: null });
  };

  return (
    <>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => close(false)} />
          <div className="relative z-10 max-w-lg w-full bg-[#0f172a] text-white rounded-xl border border-white/5 p-6 shadow-xl">
            <div className="text-sm text-gray-300 mb-4">{payload.message}</div>
            {payload.type === 'prompt' && (
              <input value={promptValue} onChange={(e) => setPromptValue(e.target.value)} className="w-full mb-4 px-3 py-2 rounded bg-[#0b1220] border border-white/5 text-white" />
            )}
            <div className="flex justify-end gap-3">
              {payload.type === 'confirm' ? (
                <>
                  <button onClick={() => close(false)} className="px-4 py-2 rounded bg-white/5 text-gray-300">Cancel</button>
                  <button onClick={() => close(true)} className="px-4 py-2 rounded bg-blue-600 text-white">Confirm</button>
                </>
              ) : payload.type === 'prompt' ? (
                <>
                  <button onClick={() => close(null)} className="px-4 py-2 rounded bg-white/5 text-gray-300">Cancel</button>
                  <button onClick={() => { payload.resolve(promptValue); setOpen(false); setPayload({ type: null, message: '', resolve: null }); }} className="px-4 py-2 rounded bg-blue-600 text-white">OK</button>
                </>
              ) : (
                <button onClick={() => close(true)} className="px-4 py-2 rounded bg-blue-600 text-white">OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
