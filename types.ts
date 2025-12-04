export enum ToolType {
  SELECT = 'SELECT',
  PEN = 'PEN',
  ERASER = 'ERASER',
  NOTE = 'NOTE',
}

export interface Point {
  x: number;
  y: number;
}

export interface Path {
  points: Point[];
  color: string;
  width: number;
}

export interface NoteData {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
}

export interface AIResponse {
  ideas: string[];
}