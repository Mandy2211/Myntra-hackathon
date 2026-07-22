import React, { useRef, useState } from 'react';
import { Mic } from 'lucide-react';

// Voice search using the browser's built-in Web Speech API.
// Feeds the recognised text back to the existing search flow via onResult.
export default function MicButton({ onResult, className = '' }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice search is not supported in this browser. Please try Chrome.');
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (text && onResult) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Search by voice"
      className={`shrink-0 transition ${listening ? 'text-pink-500 animate-pulse' : 'text-slate-400 hover:text-pink-400'} ${className}`}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
