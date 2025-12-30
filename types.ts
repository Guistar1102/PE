
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export enum NodeType {
  PIPE = 'PIPE',
  VALVE = 'VALVE',
  STATION = 'STATION',
  FITTING = 'FITTING',
  RISK = 'RISK',
  LOCATION = 'LOCATION',
  PERSON = 'PERSON',
  DOCUMENT = 'DOCUMENT',
  UNKNOWN = 'UNKNOWN'
}

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: NodeType;
  properties?: Record<string, string | number>;
  color?: string; // New: Custom color override
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export enum AIModel {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview'
}

export interface ExtractionResult {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CloudParams {
  ex: number;
  en: number;
  he: number;
}

export interface Indicator {
  id: string;
  name: string;
  weightCloud?: CloudParams;
  commentCloud?: CloudParams;
  weightScores: number[];
  commentScores: number[];
  scores: number[]; // Deprecated but kept for compatibility
}

export interface RiskAssessmentData {
  indicators: Indicator[];
  finalCloud?: CloudParams;
}
