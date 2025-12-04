import React from 'react';
import { ToolType } from '../types';
import { 
  MousePointer2, 
  Pen, 
  StickyNote as NoteIcon, 
  Eraser, 
  Sparkles, 
  Trash2,
  Undo
} from 'lucide-react';
import { PEN_COLORS } from '../constants';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  onClearBoard: () => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  canUndo: boolean;
  onUndo: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  onClearBoard,
  onGenerateAI,
  isGenerating,
  canUndo,
  onUndo
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex items-center gap-4 z-50 overflow-x-auto max-w-[95vw]">
      
      {/* Primary Tools */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        <ToolButton 
          active={activeTool === ToolType.SELECT} 
          onClick={() => onSelectTool(ToolType.SELECT)}
          icon={<MousePointer2 size={20} />}
          label="Select"
        />
        <ToolButton 
          active={activeTool === ToolType.NOTE} 
          onClick={() => onSelectTool(ToolType.NOTE)}
          icon={<NoteIcon size={20} />}
          label="Note"
        />
        <ToolButton 
          active={activeTool === ToolType.PEN} 
          onClick={() => onSelectTool(ToolType.PEN)}
          icon={<Pen size={20} />}
          label="Draw"
        />
        <ToolButton 
          active={activeTool === ToolType.ERASER} 
          onClick={() => onSelectTool(ToolType.ERASER)}
          icon={<Eraser size={20} />}
          label="Erase"
        />
      </div>

      {/* Drawing Colors (Only show if Pen is active) */}
      {activeTool === ToolType.PEN && (
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
          {PEN_COLORS.map(color => (
            <button
              key={color}
              onClick={() => onSelectColor(color)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${activeColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${!canUndo ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
          title="Undo Drawing"
        >
          <Undo size={20} />
        </button>

        <button
          onClick={onClearBoard}
          className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear Board"
        >
          <Trash2 size={20} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <button
          onClick={onGenerateAI}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isGenerating 
              ? 'bg-brand-100 text-brand-600 cursor-wait' 
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-md hover:scale-105'
          }`}
        >
          <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Thinking...' : 'AI Spark'}
        </button>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({
  active, onClick, icon, label
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 min-w-[60px] ${
      active 
        ? 'bg-brand-50 text-brand-600 shadow-sm' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);