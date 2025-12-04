import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ToolType, NoteData, Path, Point } from './types';
import { NOTE_COLORS, PEN_COLORS, DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT } from './constants';
import { Toolbar } from './components/Toolbar';
import { StickyNote } from './components/StickyNote';
import { generateBrainstormIdeas } from './services/geminiService';
import { nanoid } from 'nanoid';

function App() {
  // State
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.SELECT);
  const [activeColor, setActiveColor] = useState<string>(PEN_COLORS[0]);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome note
  useEffect(() => {
    setNotes([
      {
        id: nanoid(),
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 80,
        content: "Welcome to MindCanvas!\n\n- Select 'Pen' to draw\n- Select 'Note' to add ideas\n- Click 'AI Spark' to generate new ideas!",
        color: NOTE_COLORS[0]
      }
    ]);
  }, []);

  // --- Drawing Logic ---

  // Redraw canvas when paths change or during drawing
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw saved paths
    paths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current path being drawn
    if (isDrawing && currentPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 3;
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [paths, isDrawing, currentPath, activeColor]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        redrawCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);


  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;

    if (activeTool === ToolType.NOTE) {
      // Create new note
      const newNote: NoteData = {
        id: nanoid(),
        x: clientX - DEFAULT_NOTE_WIDTH / 2,
        y: clientY - DEFAULT_NOTE_HEIGHT / 2,
        content: '',
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
      };
      setNotes(prev => [...prev, newNote]);
      setActiveTool(ToolType.SELECT); // Switch back to select after placing
      return;
    }

    if (activeTool === ToolType.PEN) {
      setIsDrawing(true);
      setCurrentPath([{ x: clientX, y: clientY }]);
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;

    if (isDrawing && activeTool === ToolType.PEN) {
      setCurrentPath(prev => [...prev, { x: clientX, y: clientY }]);
      return;
    }

    if (draggedNoteId && activeTool === ToolType.SELECT) {
      setNotes(prev => prev.map(note => {
        if (note.id === draggedNoteId) {
          return {
            ...note,
            x: clientX - dragOffset.x,
            y: clientY - dragOffset.y
          };
        }
        return note;
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool === ToolType.PEN) {
      setIsDrawing(false);
      if (currentPath.length > 2) {
        setPaths(prev => [...prev, { points: currentPath, color: activeColor, width: 3 }]);
      }
      setCurrentPath([]);
    }

    setDraggedNoteId(null);
  };

  // --- Note Actions ---

  const handleNoteMouseDown = (e: React.MouseEvent, id: string) => {
    if (activeTool === ToolType.SELECT) {
      const note = notes.find(n => n.id === id);
      if (note) {
        setDraggedNoteId(id);
        setDragOffset({
          x: e.clientX - note.x,
          y: e.clientY - note.y
        });
      }
    } else if (activeTool === ToolType.ERASER) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // --- AI Logic ---

  const handleGenerateIdeas = async () => {
    if (notes.length === 0) {
      alert("Add some notes first so the AI has context!");
      return;
    }

    setIsGenerating(true);
    const context = notes.map(n => n.content).filter(c => c.trim().length > 0);
    
    if (context.length === 0) {
      setIsGenerating(false);
      alert("Your notes are empty. Write something!");
      return;
    }

    const newIdeas = await generateBrainstormIdeas(context);

    // Arrange new notes in a semi-random circle or grid around the center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 300;
    
    const createdNotes: NoteData[] = newIdeas.map((idea, index) => {
      const angle = (index / newIdeas.length) * 2 * Math.PI;
      return {
        id: nanoid(),
        x: centerX + radius * Math.cos(angle) - (DEFAULT_NOTE_WIDTH / 2),
        y: centerY + radius * Math.sin(angle) - (DEFAULT_NOTE_HEIGHT / 2),
        content: idea,
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
      };
    });

    setNotes(prev => [...prev, ...createdNotes]);
    setIsGenerating(false);
  };

  const clearBoard = () => {
    if (confirm("Are you sure you want to clear the entire board?")) {
      setNotes([]);
      setPaths([]);
    }
  };

  const undoLastPath = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden bg-slate-50 bg-grid ${activeTool === ToolType.PEN ? 'cursor-crosshair' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas for Drawing */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 z-0 pointer-events-none" 
      />

      {/* Sticky Notes Layer */}
      {notes.map(note => (
        <StickyNote
          key={note.id}
          note={note}
          isSelected={false}
          onUpdate={updateNoteContent}
          onDelete={deleteNote}
          onMouseDown={handleNoteMouseDown}
        />
      ))}

      {/* Help / Instructions (Fades out or simple text) */}
      <div className="absolute top-4 left-4 pointer-events-none opacity-50 select-none">
        <h1 className="text-2xl font-bold text-slate-400">MindCanvas</h1>
        <p className="text-sm text-slate-400">Collaborative Brainstorming</p>
      </div>

      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        activeColor={activeColor}
        onSelectColor={setActiveColor}
        onClearBoard={clearBoard}
        onGenerateAI={handleGenerateIdeas}
        isGenerating={isGenerating}
        canUndo={paths.length > 0}
        onUndo={undoLastPath}
      />
    </div>
  );
}

export default App;