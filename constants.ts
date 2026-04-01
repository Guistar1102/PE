
import { NodeType, GraphData } from './types';

export const NODE_COLORS: Record<NodeType, string> = {
  [NodeType.PIPE]: '#3b82f6',    // Blue
  [NodeType.VALVE]: '#ef4444',   // Red
  [NodeType.STATION]: '#eab308', // Yellow
  [NodeType.FITTING]: '#10b981', // Emerald
  [NodeType.RISK]: '#f97316',    // Orange
  [NodeType.LOCATION]: '#8b5cf6',// Violet
  [NodeType.PERSON]: '#ec4899',  // Pink
  [NodeType.DOCUMENT]: '#64748b',// Slate
  [NodeType.UNKNOWN]: '#9ca3af', // Gray
};

export const NODE_LABELS_ZH: Record<NodeType, string> = {
  [NodeType.PIPE]: '管道/管材',
  [NodeType.VALVE]: '阀门/设备',
  [NodeType.STATION]: '场站/系统',
  [NodeType.FITTING]: '管件/接头',
  [NodeType.RISK]: '风险/检测',
  [NodeType.LOCATION]: '环境/位置',
  [NodeType.PERSON]: '人员/单位',
  [NodeType.DOCUMENT]: '数据/档案',
  [NodeType.UNKNOWN]: '其他',
};

// Based on the provided PDF content regarding Gas PE Pipeline Data
export const INITIAL_DATA: GraphData = {
  nodes: [
    // --- 0. 核心系统 ---
    { id: 'root', label: '城市燃气PE管道系统-G01', type: NodeType.STATION, properties: { region: 'East District' } },
    
    // --- 1. 基础数据板块 (Basic Data) ---
    { id: 'cat_basic', label: '基础数据管理', type: NodeType.DOCUMENT, properties: {} },
    { id: 'b_mat_type', label: 'PE100混配料', type: NodeType.PIPE, properties: { grade: 'PE100' } },
    { id: 'b_cert', label: '管材合格证#2023-A', type: NodeType.DOCUMENT, properties: {} },
    { id: 'b_warranty', label: '质量保证书', type: NodeType.DOCUMENT, properties: {} },
    { id: 'b_mfr', label: '熔体质量流动速率', type: NodeType.DOCUMENT, properties: { value: '0.5g/10min' } },
    { id: 'b_oxi', label: '氧化诱导时间(OIT)', type: NodeType.DOCUMENT, properties: { value: '>20min' } },
    { id: 'b_hydro', label: '静液压强度试验', type: NodeType.RISK, properties: { result: 'Pass' } },
    { id: 'b_elong', label: '断裂伸长率', type: NodeType.DOCUMENT, properties: { value: '>350%' } },
    
    // --- 2. 生产与设计板块 (Production & Design) ---
    { id: 'cat_prod', label: '生产与设计参数', type: NodeType.STATION, properties: {} },
    { id: 'p_pipe_1', label: 'DN160主干管', type: NodeType.PIPE, properties: { sdr: '11' } },
    { id: 'p_pipe_2', label: 'DN110支线管', type: NodeType.PIPE, properties: { sdr: '17.6' } },
    { id: 'p_design_press', label: '设计压力 0.4MPa', type: NodeType.DOCUMENT, properties: {} },
    { id: 'p_work_temp', label: '工作温度 20℃', type: NodeType.DOCUMENT, properties: {} },
    { id: 'p_sdr', label: '标准尺寸比(SDR)', type: NodeType.DOCUMENT, properties: {} },
    { id: 'p_manuf', label: '制管商: 华创管业', type: NodeType.PERSON, properties: {} },
    { id: 'p_batch', label: '生产批号: B231005', type: NodeType.DOCUMENT, properties: {} },
    { id: 'p_design_life', label: '设计寿命 50年', type: NodeType.DOCUMENT, properties: {} },

    // --- 3. 安装与环境板块 (Installation & Environment) ---
    { id: 'cat_install', label: '安装敷设环境', type: NodeType.LOCATION, properties: {} },
    { id: 'i_soil_res', label: '土壤电阻率', type: NodeType.LOCATION, properties: { value: '25Ω.m' } },
    { id: 'i_soil_ph', label: '土壤酸碱度', type: NodeType.LOCATION, properties: { ph: '6.5' } },
    { id: 'i_depth', label: '管道埋深 1.2m', type: NodeType.LOCATION, properties: {} },
    { id: 'i_gps', label: 'GPS定位坐标', type: NodeType.LOCATION, properties: { lat: '32.1', lon: '118.5' } },
    { id: 'i_stray_current', label: '杂散电流干扰', type: NodeType.RISK, properties: { level: 'Low' } },
    { id: 'i_crossing', label: '穿越河流工程', type: NodeType.LOCATION, properties: { type: 'River' } },
    { id: 'i_bedding', label: '管沟砂垫层', type: NodeType.LOCATION, properties: {} },
    { id: 'i_tracer', label: '示踪线/警示带', type: NodeType.FITTING, properties: {} },
    { id: 'i_protection', label: '法面保护装置', type: NodeType.VALVE, properties: {} },
    { id: 'i_traffic', label: '交通繁忙程度: 高', type: NodeType.RISK, properties: {} },

    // --- 4. 运营与维护板块 (Operation & Maintenance) ---
    { id: 'cat_op', label: '运营检测记录', type: NodeType.STATION, properties: {} },
    { id: 'o_welder', label: '焊工: 张三', type: NodeType.PERSON, properties: { cert: 'Valid' } },
    { id: 'o_weld_proc', label: '热熔焊接工艺', type: NodeType.DOCUMENT, properties: {} },
    { id: 'o_weld_temp', label: '焊接温度 210℃', type: NodeType.DOCUMENT, properties: {} },
    { id: 'o_cool_time', label: '冷却时间 20min', type: NodeType.DOCUMENT, properties: {} },
    { id: 'o_inspect_macro', label: '宏观外观检查', type: NodeType.RISK, properties: {} },
    { id: 'o_inspect_dr', label: 'DR成像检测', type: NodeType.RISK, properties: {} },
    { id: 'o_inspect_ultra', label: '非线性超声检测', type: NodeType.RISK, properties: {} },
    { id: 'o_leak_check', label: '气密性试验', type: NodeType.RISK, properties: { result: 'Good' } },
    { id: 'o_anode', label: '牺牲阳极保护', type: NodeType.VALVE, properties: {} },
    { id: 'o_valve_well', label: '阀门井#5', type: NodeType.VALVE, properties: {} },
    { id: 'o_pressure_log', label: '压力波动记录', type: NodeType.DOCUMENT, properties: {} },
    { id: 'o_risk_corr', label: '环境腐蚀性评估', type: NodeType.RISK, properties: { grade: 'II' } },
    { id: 'o_maintain', label: '年度维护记录', type: NodeType.DOCUMENT, properties: {} },

    // --- 5. 隐患与第三方 (Risks) ---
    { id: 'r_occupy', label: '违规占压', type: NodeType.RISK, properties: {} },
    { id: 'r_digging', label: '第三方施工', type: NodeType.RISK, properties: {} },
    { id: 'r_termites', label: '白蚁/鼠害风险', type: NodeType.RISK, properties: {} },
    { id: 'r_defect', label: '防腐层破损', type: NodeType.RISK, properties: {} },

    // --- 6. 辅助设备 ---
    { id: 'e_flange', label: '钢塑转换法兰', type: NodeType.FITTING, properties: {} },
    { id: 'e_meter', label: '流量计', type: NodeType.VALVE, properties: {} },
    { id: 'e_condense', label: '凝水缸', type: NodeType.VALVE, properties: {} },
  ],
  links: [
    // Root Connections
    { source: 'root', target: 'cat_basic', label: '包含' },
    { source: 'root', target: 'cat_prod', label: '包含' },
    { source: 'root', target: 'cat_install', label: '包含' },
    { source: 'root', target: 'cat_op', label: '包含' },

    // Basic Data Connections
    { source: 'cat_basic', target: 'b_mat_type', label: '材质' },
    { source: 'b_mat_type', target: 'b_cert', label: '认证' },
    { source: 'b_mat_type', target: 'b_warranty', label: '质保' },
    { source: 'b_mat_type', target: 'b_mfr', label: '参数' },
    { source: 'b_mat_type', target: 'b_oxi', label: '参数' },
    { source: 'b_mat_type', target: 'b_elong', label: '参数' },
    { source: 'b_mat_type', target: 'b_hydro', label: '测试' },

    // Production Connections
    { source: 'cat_prod', target: 'p_pipe_1', label: '资产' },
    { source: 'cat_prod', target: 'p_pipe_2', label: '资产' },
    { source: 'p_pipe_1', target: 'p_manuf', label: '生产商' },
    { source: 'p_pipe_1', target: 'p_batch', label: '批次' },
    { source: 'p_pipe_1', target: 'p_design_press', label: '设计参数' },
    { source: 'p_pipe_1', target: 'p_design_life', label: '寿命' },
    { source: 'p_pipe_1', target: 'p_sdr', label: '规格' },
    { source: 'p_pipe_2', target: 'p_design_press', label: '设计参数' },
    { source: 'p_pipe_1', target: 'b_mat_type', label: '使用材料' }, // Cross-link

    // Installation Connections
    { source: 'cat_install', target: 'i_gps', label: '定位' },
    { source: 'cat_install', target: 'i_depth', label: '埋设' },
    { source: 'cat_install', target: 'i_soil_res', label: '环境' },
    { source: 'cat_install', target: 'i_soil_ph', label: '环境' },
    { source: 'i_gps', target: 'p_pipe_1', label: '定位' },
    { source: 'i_depth', target: 'p_pipe_1', label: '属性' },
    { source: 'p_pipe_1', target: 'i_crossing', label: '穿越' },
    { source: 'p_pipe_1', target: 'i_bedding', label: '保护' },
    { source: 'p_pipe_1', target: 'i_tracer', label: '附属' },
    { source: 'i_crossing', target: 'i_protection', label: '需安装' },
    { source: 'i_traffic', target: 'p_pipe_1', label: '影响' },
    { source: 'i_stray_current', target: 'i_gps', label: '检测点' },

    // Operation Connections
    { source: 'cat_op', target: 'o_maintain', label: '记录' },
    { source: 'o_welder', target: 'o_weld_proc', label: '执行' },
    { source: 'o_weld_proc', target: 'o_weld_temp', label: '参数' },
    { source: 'o_weld_proc', target: 'o_cool_time', label: '参数' },
    { source: 'o_welder', target: 'p_pipe_1', label: '作业' }, // Cross-link
    { source: 'cat_op', target: 'o_inspect_macro', label: '方法' },
    { source: 'cat_op', target: 'o_inspect_dr', label: '方法' },
    { source: 'cat_op', target: 'o_inspect_ultra', label: '方法' },
    { source: 'o_inspect_ultra', target: 'p_pipe_1', label: '检测对象' },
    { source: 'o_leak_check', target: 'root', label: '系统测试' },
    { source: 'o_pressure_log', target: 'p_design_press', label: '对比' },
    { source: 'o_valve_well', target: 'p_pipe_1', label: '连接' },
    { source: 'o_anode', target: 'p_pipe_1', label: '阴极保护' },
    { source: 'o_risk_corr', target: 'i_soil_ph', label: '关联' },

    // Risk & Components Connections
    { source: 'r_digging', target: 'p_pipe_1', label: '威胁' },
    { source: 'r_occupy', target: 'p_pipe_2', label: '威胁' },
    { source: 'r_termites', target: 'i_soil_ph', label: '相关' },
    { source: 'r_defect', target: 'o_anode', label: '失效原因' },
    { source: 'e_flange', target: 'p_pipe_1', label: '连接' },
    { source: 'e_meter', target: 'o_valve_well', label: '安装于' },
    { source: 'e_condense', target: 'p_pipe_1', label: '附属' },
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
      { id: 't1_6', label: '119报警中心', type: NodeType.PERSON },
      { id: 't1_7', label: '疏散人群', type: NodeType.LOCATION },
    ],
    links: [
      { source: 't1_1', target: 't1_2', label: '包含' },
      { source: 't1_3', target: 't1_2', label: '发生于' },
      { source: 't1_4', target: 't1_3', label: '负责处理' },
      { source: 't1_4', target: 't1_5', label: '参考' },
      { source: 't1_4', target: 't1_6', label: '联络' },
      { source: 't1_3', target: 't1_7', label: '影响' },
    ]
  },
  "empty": { nodes: [], links: [] }
};
