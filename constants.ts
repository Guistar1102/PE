
import { NodeType, GraphData, Indicator } from './types';

export const NODE_COLORS: Record<NodeType, string> = {
  [NodeType.PIPE]: '#3b82f6',
  [NodeType.VALVE]: '#ef4444',
  [NodeType.STATION]: '#eab308',
  [NodeType.FITTING]: '#10b981',
  [NodeType.RISK]: '#f97316',
  [NodeType.LOCATION]: '#8b5cf6',
  [NodeType.PERSON]: '#ec4899',
  [NodeType.DOCUMENT]: '#64748b',
  [NodeType.UNKNOWN]: '#9ca3af',
};

export const NODE_LABELS_ZH: Record<NodeType, string> = {
  [NodeType.PIPE]: '管道',
  [NodeType.VALVE]: '阀门',
  [NodeType.STATION]: '场站/调压箱',
  [NodeType.FITTING]: '管件',
  [NodeType.RISK]: '风险隐患',
  [NodeType.LOCATION]: '地理位置',
  [NodeType.PERSON]: '人员',
  [NodeType.DOCUMENT]: '文档规范',
  [NodeType.UNKNOWN]: '未知',
};

export const INITIAL_DATA: GraphData = {
  nodes: [
    { id: 'n1', label: '朝阳路主干管', type: NodeType.PIPE, properties: { diameter: 'DN200', material: 'PE100' } },
    { id: 'n2', label: '1号调压站', type: NodeType.STATION, properties: { pressure: 'Middle' } },
    { id: 'n3', label: 'V-001阀门', type: NodeType.VALVE, properties: { status: 'Open' } },
    { id: 'n4', label: '幸福小区', type: NodeType.LOCATION, properties: {} },
    { id: 'n5', label: '腐蚀风险点', type: NodeType.RISK, properties: { level: 'High' } }
  ],
  links: [
    { source: 'n1', target: 'n2', label: '连接' },
    { source: 'n1', target: 'n3', label: '包含' },
    { source: 'n2', target: 'n4', label: '供气给' },
    { source: 'n5', target: 'n1', label: '位于' }
  ]
};

export const GRAPH_TEMPLATES: Record<string, GraphData> = {
  "demo": INITIAL_DATA,
  "station_leak": {
    nodes: [
      { id: 't1_1', label: '滨海调压站', type: NodeType.STATION },
      { id: 't1_2', label: '进站总阀', type: NodeType.VALVE },
      { id: 't1_3', label: '法兰泄漏', type: NodeType.RISK },
      { id: 't1_4', label: '张工', type: NodeType.PERSON },
      { id: 't1_5', label: '抢修预案V2.0', type: NodeType.DOCUMENT },
    ],
    links: [
      { source: 't1_1', target: 't1_2', label: '包含' },
      { source: 't1_3', target: 't1_2', label: '发生于' },
      { source: 't1_4', target: 't1_3', label: '负责处理' },
      { source: 't1_4', target: 't1_5', label: '参考' },
    ]
  },
  "empty": { nodes: [], links: [] }
};

// Default Level 2 Indicators for Gas PE Pipeline Risk Assessment
// Fix: Added missing weightScores and commentScores properties to satisfy the Indicator interface.
export const DEFAULT_RISK_INDICATORS: Indicator[] = [
  { id: 'ind_1', name: '管道材质质量', weightScores: [], commentScores: [], scores: [] },
  { id: 'ind_2', name: '施工焊接质量', weightScores: [], commentScores: [], scores: [] },
  { id: 'ind_3', name: '第三方施工活动', weightScores: [], commentScores: [], scores: [] },
  { id: 'ind_4', name: '腐蚀及环境压力', weightScores: [], commentScores: [], scores: [] },
  { id: 'ind_5', name: '运行维护水平', weightScores: [], commentScores: [], scores: [] },
  { id: 'ind_6', name: '安全管理制度', weightScores: [], commentScores: [], scores: [] },
];
