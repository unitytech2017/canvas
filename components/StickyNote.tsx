import React, { useRef, useEffect } from 'react';
import { NoteData } from '../types';
import { DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT } from '../constants';
import { X } from 'lucide-react';

interface StickyNoteProps {
  note: NoteData;
  isSelected: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  isSelected,
  onUpdate,
  onDelete,
  onMouseDown
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus new empty notes
  useEffect(() => {
    if (note.content === '' && isSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div
      className={`absolute shadow-lg flex flex-col p-3 transition-shadow duration-200 ${isSelected ? 'shadow-2xl ring-2 ring-blue-400 z-50' : 'hover:shadow-xl z-10'}`}
      style={{
        left: note.x,
        top: note.y,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        backgroundColor: note.color,
        transform: 'rotate(-1deg)', // Slight aesthetic tilt
        cursor: 'grab',
      }}
      onMouseDown={(e) => {
        // Prevent drag when interacting with delete button or text area specifically (if needed)
        // But we usually want to drag by grabbing the note body
        onMouseDown(e, note.id);
      }}
    >
      <div className="flex justify-end mb-1">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
        >
          <X size={14} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={note.content}
        onChange={(e) => onUpdate(note.id, e.target.value)}
        onMouseDown={(e) => e.stopPropagation()} // Allow typing without dragging
        placeholder="Type an idea..."
        className="flex-1 w-full bg-transparent resize-none outline-none font-hand text-lg text-gray-800 leading-snug placeholder-gray-400/70"
        style={{ fontFamily: '"Kalam", cursive' }}
      />
    </div>
  );
};