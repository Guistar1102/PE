import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

// Enum for Node Types specific to Gas PE Pipelines
export enum NodeType {
  PIPE = 'PIPE',          // 管道
  VALVE = 'VALVE',        // 阀门
  STATION = 'STATION',    // 调压站/场站
  FITTING = 'FITTING',    // 管件 (弯头, 三通)
  RISK = 'RISK',          // 风险点/隐患
  LOCATION = 'LOCATION',  // 地理位置
  PERSON = 'PERSON',      // 责任人/施工人员
  DOCUMENT = 'DOCUMENT',  // 施工文档/规范
  UNKNOWN = 'UNKNOWN'
}

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: NodeType;
  properties?: Record<string, string | number>;
  // D3 simulation props (optional as they are added by D3)
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode; // D3 converts string ID to object ref
  target: string | GraphNode;
  label: string; // Relationship name (e.g. "CONNECTS_TO")
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export enum AIModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface ExtractionResult {
  nodes: {
    id: string;
    label: string;
    type: string;
    properties?: {
      info?: string;
    };
  }[];
  links: {
    source: string;
    target: string;
    label: string;
  }[];
}