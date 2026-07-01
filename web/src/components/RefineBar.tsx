import { useState } from 'react';

const PRESETS = ['Cheaper', 'More outdoors & hiking', 'Less city, more nature', 'More relaxed pace', 'Pack in more'];

export function RefineBar({ onRefine, busy }: { onRefine: (instruction: string) => void; busy: boolean }) {
  const [text, setText] = useState('');
  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-lg">Refine</h3>
        <p className="text-sm text-haze">Push back in plain language — the agent re-plans.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p} className="chip" onClick={() => onRefine(p)} disabled={busy}>
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="field"
          placeholder="e.g. closer to home, more food, add a beach day"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              onRefine(text.trim());
              setText('');
            }
          }}
        />
        <button
          className="btn-ghost"
          disabled={busy || !text.trim()}
          onClick={() => {
            onRefine(text.trim());
            setText('');
          }}
        >
          Refine
        </button>
      </div>
    </div>
  );
}
