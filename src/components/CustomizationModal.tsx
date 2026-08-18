import React, { useState } from 'react';
import { X, Palette, Volume2, Sparkles, CheckCircle2, Shield } from 'lucide-react';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySettings?: (settings: CustomizationSettings) => void;
}

export interface CustomizationSettings {
  soundpack: string;
  boardSkin: string;
  pieceStyle: string;
  ambientGlow: boolean;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  onApplySettings,
}) => {
  const [soundpack, setSoundpack] = useState('classic');
  const [boardSkin, setBoardSkin] = useState('wood');
  const [pieceStyle, setPieceStyle] = useState('classic');
  const [ambientGlow, setAmbientGlow] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onApplySettings) {
      onApplySettings({ soundpack, boardSkin, pieceStyle, ambientGlow });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
              <Palette className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Audio &amp; Visual Customizer</h2>
              <p className="text-xs text-indigo-200/60">Customize board skins, piece designs &amp; soundscapes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Soundpack Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300/70 block flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audio Soundpack</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'classic', name: 'Classic Wood', desc: 'Authentic wooden piece clacks & soft timer ticks' },
                { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Futuristic synth chime moves & energetic capture FX' },
                { id: 'retro', name: '8-Bit Arcade', desc: 'Chiptune retro gaming sounds & arcade victory fanfare' },
                { id: 'lofi', name: 'Lo-Fi Zen', desc: 'Soothing rain ambient beats & calm, soft clicks' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSoundpack(item.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1 ${
                    soundpack === item.id
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{item.name}</span>
                    {soundpack === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <span className="text-[10px] text-indigo-200/60 leading-tight">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Board Skin Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300/70 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Board Texture &amp; Style</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'wood', name: 'Oak Wood' },
                { id: 'marble', name: 'Carrara Marble' },
                { id: 'glass', name: 'Frosted Glass' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setBoardSkin(item.id)}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition ${
                    boardSkin === item.id
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Glow Toggle */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Ambient Studio Lighting</span>
              <span className="text-[11px] text-indigo-200/60">Enable dynamic backlight glow under board games</span>
            </div>
            <button
              onClick={() => setAmbientGlow(!ambientGlow)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                ambientGlow ? 'bg-purple-500 justify-end' : 'bg-white/20 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20"
          >
            Apply &amp; Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
