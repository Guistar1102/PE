
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Settings2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sliders, 
  Table as TableIcon,
  LayoutDashboard,
  Plus,
  Activity,
  Layers,
  MousePointerClick,
  ChevronRight,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X // Added X icon
} from 'lucide-react';
import * as d3 from 'd3';
import { CloudParams, Indicator } from '../types';
import { calculateCloudParams, aggregateClouds } from '../utils/cloudModel';
import CloudChart from './CloudChart';

interface CloudLayer {
  id: string;
  name: string;
  params: CloudParams;
  color: string;
  visible: boolean;
  type: 'weight' | 'comment' | 'final';
  indicatorId?: string;
}

// 预设的演示数据，包含高、中、低不同风险等级，使图表看起来丰富
const DEMO_INDICATORS = [
  { 
    id: 'ind_1', name: '管道本体结构完整性', 
    weightScores: [8.5, 9.0, 8.5, 9.0, 8.0], // 权重高
    commentScores: [92, 95, 90, 94, 91],      // 分数高 -> 低风险 (安全)
    scores: [] 
  },
  { 
    id: 'ind_2', name: '焊接与接口质量管控', 
    weightScores: [7.5, 7.0, 8.0, 7.5, 7.0], 
    commentScores: [75, 72, 78, 74, 76],      // 分数中 -> 中低风险 (良好)
    scores: [] 
  },
  { 
    id: 'ind_3', name: '第三方施工破坏风险', 
    weightScores: [9.5, 9.8, 9.2, 9.5, 9.0], // 权重极高
    commentScores: [42, 38, 45, 40, 48],     // 分数极低 -> 极高风险 (危险)
    scores: [] 
  },
  { 
    id: 'ind_4', name: '腐蚀环境与阴保系统', 
    weightScores: [6.0, 6.5, 6.0, 5.5, 6.5], 
    commentScores: [58, 62, 55, 60, 56],     // 分数偏低 -> 中高风险 (关注)
    scores: [] 
  },
  { 
    id: 'ind_5', name: '日常巡检与维护管理', 
    weightScores: [5.0, 5.5, 5.0, 5.2, 4.8], 
    commentScores: [85, 82, 88, 84, 86],     // 分数高 -> 低风险 (安全)
    scores: [] 
  }
];

const RiskModule: React.FC = () => {
  // 核心数据：指标及专家评分
  const [indicators, setIndicators] = useState<Indicator[]>(DEMO_INDICATORS as any);
  
  const [viewMode, setViewMode] = useState<'viz' | 'table'>('viz');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(indicators[0]?.id || null);
  const [expertCount, setExpertCount] = useState(5);
  // 使用 Set 存储被隐藏的图层 ID
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false); // 新增：控制放大视图状态

  // 计算图层数据
  const layers = useMemo(() => {
    const list: CloudLayer[] = [];
    
    // 颜色池：使用 D3 的 Tableau10 色板，保证颜色区分度高且美观
    const colors = d3.schemeTableau10;

    indicators.forEach((ind, i) => {
      const wParams = calculateCloudParams((ind as any).weightScores || []);
      const cParams = calculateCloudParams((ind as any).commentScores || []);
      
      const wId = `w_${ind.id}`;
      const cId = `c_${ind.id}`;
      const color = colors[i % colors.length];

      // 权重云层
      list.push({
        id: wId,
        name: `${ind.name} (权重)`,
        params: wParams,
        color: color,
        visible: !hiddenLayerIds.has(wId),
        type: 'weight',
        indicatorId: ind.id
      });
      
      // 评价云层
      list.push({
        id: cId,
        name: `${ind.name} (评价)`,
        params: cParams,
        color: color,
        visible: !hiddenLayerIds.has(cId),
        type: 'comment',
        indicatorId: ind.id
      });
    });

    // 计算综合云
    const wClouds = indicators.map(ind => calculateCloudParams((ind as any).weightScores || []));
    const cClouds = indicators.map(ind => calculateCloudParams((ind as any).commentScores || []));
    
    if (wClouds.length > 0) {
      const final = aggregateClouds(cClouds, wClouds);
      const fId = 'final_risk';
      list.push({
        id: fId,
        name: '综合风险云 (最终结果)',
        params: final,
        color: '#ffffff', // 白色或亮色，突出显示
        visible: !hiddenLayerIds.has(fId),
        type: 'final'
      });
    }

    return list;
  }, [indicators, hiddenLayerIds]);

  // 综合评价结论逻辑
  const conclusion = useMemo(() => {
    const final = layers.find(l => l.id === 'final_risk')?.params;
    if (!final) return { text: '暂无数据', level: 0, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
    const ex = final.ex;
    // 根据分值判断风险等级 (分数越低风险越高)
    if (ex < 60) return { text: '高风险 (IV级) - 需立即整改', level: 4, color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/50' };
    if (ex < 75) return { text: '中风险 (III级) - 需加强监控', level: 3, color: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/50' };
    if (ex < 85) return { text: '低风险 (II级) - 状态良好', level: 2, color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-500/50' };
    return { text: '安全 (I级) - 运行平稳', level: 1, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50' };
  }, [layers]);

  // 操作函数
  const toggleVisibility = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHiddenLayerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteIndicator = (id: string) => {
    if (window.confirm('确定要删除该指标及其关联图层吗？')) {
      setIndicators(prev => prev.filter(ind => ind.id !== id));
      if (selectedIndicatorId === id) setSelectedIndicatorId(null);
    }
  };

  const handleScoreChange = (indicatorId: string, type: 'weight' | 'comment', index: number, value: number) => {
    setIndicators(prev => prev.map(ind => {
      if (ind.id === indicatorId) {
        const key = type === 'weight' ? 'weightScores' : 'commentScores';
        const newScores = [...(ind as any)[key]];
        newScores[index] = value;
        return { ...ind, [key]: newScores };
      }
      return ind;
    }));
  };

  const addNewIndicator = () => {
    const name = prompt('请输入新指标名称：');
    if (!name) return;
    const newInd: any = {
      id: `new_${Date.now()}`,
      name,
      weightScores: Array(expertCount).fill(5),
      commentScores: Array(expertCount).fill(60)
    };
    setIndicators(prev => [...prev, newInd]);
    setSelectedIndicatorId(newInd.id);
  };

  const currentIndicator = indicators.find(i => i.id === selectedIndicatorId);

  return (
    <div className="flex h-full bg-[#020617] text-slate-300 font-sans overflow-hidden select-none relative">
      
      {/* ---------------- 放大视图 Modal ---------------- */}
      {isMaximized && (
        <div className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
           <div className="w-full h-full max-w-6xl max-h-[90vh] bg-[#0b1221] border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col p-2">
               {/* 关闭按钮 */}
               <button 
                  onClick={() => setIsMaximized(false)}
                  className="absolute top-4 right-4 z-20 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-700 shadow-lg"
                  title="关闭详情视图"
               >
                  <X size={24} />
               </button>
               
               {/* 放大图表 */}
               <div className="flex-1 overflow-hidden rounded-xl bg-slate-950/50">
                   <CloudChart 
                      title="综合风险评价云图 (详细透视)" 
                      clouds={layers.filter(l => (l.type === 'final' || l.type === 'comment') && l.visible).map(l => ({ ...l, label: l.name }))} 
                      height={700} // 设置更大的高度
                   />
               </div>
           </div>
        </div>
      )}

      {/* ---------------- 左侧栏：导航与控制 (20%) ---------------- */}
      <div 
        className={`${isSidebarOpen ? 'w-72 border-r' : 'w-0 border-none'} flex flex-col border-slate-800/60 bg-[#060a15] transition-all duration-300 overflow-hidden relative shadow-xl z-20`}
      >
        <div className="min-w-[18rem] h-full flex flex-col"> 
          
          {/* 顶部标题栏 */}
          <div className="h-14 px-4 border-b border-slate-800/60 flex items-center justify-between bg-[#060a15] sticky top-0 z-10">
             <div className="flex items-center gap-2.5 text-slate-100">
               <div className="p-1.5 bg-blue-600/20 rounded-md">
                 <Layers size={16} className="text-blue-400"/>
               </div>
               <span className="text-sm font-bold tracking-wide">评价指标体系</span>
             </div>
             {/* 
             <button onClick={addNewIndicator} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors" title="添加新指标">
               <Plus size={16} />
             </button>
             */}
          </div>

          {/* 综合层控制卡片 */}
          <div className="px-4 pt-5 pb-2">
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-3 shadow-inner">
                 <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" /> 
                    <span>综合风险评估结果</span>
                 </div>
                 {layers.filter(l => l.type === 'final').map(layer => (
                   <div key={layer.id} className="flex items-center justify-between bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                        <span className="text-xs text-slate-200 font-medium">综合云 (Final Cloud)</span>
                      </div>
                      <button 
                        onClick={(e) => toggleVisibility(layer.id, e)} 
                        className={`p-1.5 rounded-md transition-all ${layer.visible ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'}`} 
                        title={layer.visible ? "点击隐藏" : "点击显示"}
                      >
                          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                   </div>
                 ))}
              </div>
          </div>

          {/* 指标列表与显隐控制 */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-scrollbar">
             <div className="flex justify-between items-end px-1 mb-2 border-b border-slate-800/50 pb-1">
               <span className="text-[10px] font-bold text-slate-500 uppercase">分项指标 ({indicators.length})</span>
               <span className="text-[10px] text-slate-600">显隐控制</span>
             </div>
             
             {indicators.map((ind, index) => {
               const isSelected = selectedIndicatorId === ind.id;
               const wLayer = layers.find(l => l.id === `w_${ind.id}`);
               const cLayer = layers.find(l => l.id === `c_${ind.id}`);
               const indicatorColor = wLayer?.color || '#ccc';
               
               return (
                 <div 
                   key={ind.id}
                   onClick={() => setSelectedIndicatorId(ind.id)}
                   className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800/80 border-blue-500/30 shadow-lg' 
                        : 'bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-800'
                   }`}
                 >
                   {/* 选中指示条 */}
                   {isSelected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                   
                   <div className="flex flex-col gap-2 pl-2">
                      {/* 指标名称 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: indicatorColor }} />
                           <span className={`text-xs font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                             {ind.name}
                           </span>
                        </div>
                        {isSelected && <ChevronRight size={14} className="text-blue-500/50" />}
                      </div>

                      {/* 显隐控制按钮行 */}
                      <div className="flex gap-2 mt-1">
                        {wLayer && (
                          <button 
                            onClick={(e) => toggleVisibility(wLayer.id, e)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[10px] border transition-all ${
                              wLayer.visible 
                               ? 'bg-slate-700/50 text-slate-200 border-slate-600' 
                               : 'bg-slate-900/50 text-slate-600 border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                            title="切换 [权重云] 显示状态"
                          >
                             <div className={`w-1.5 h-1.5 rounded-full ${wLayer.visible ? 'bg-blue-400 shadow-[0_0_5px_currentColor]' : 'border border-slate-500'}`} />
                             权重
                          </button>
                        )}
                        {cLayer && (
                          <button 
                            onClick={(e) => toggleVisibility(cLayer.id, e)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[10px] border transition-all ${
                              cLayer.visible 
                               ? 'bg-slate-700/50 text-slate-200 border-slate-600' 
                               : 'bg-slate-900/50 text-slate-600 border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                            title="切换 [评价云] 显示状态"
                          >
                             <div className={`w-1.5 h-1.5 rounded-full ${cLayer.visible ? 'bg-emerald-400 shadow-[0_0_5px_currentColor]' : 'border border-slate-500'}`} />
                             评价
                          </button>
                        )}
                      </div>
                   </div>
                 </div>
               );
             })}
          </div>

          {/* 底部配置区 */}
          <div className="p-4 border-t border-slate-800/60 bg-[#050810]">
             <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
               <User size={14} className="text-slate-500"/>
               <span className="text-xs text-slate-400 flex-1">专家评审人数</span>
               <div className="flex items-center gap-2">
                 <button onClick={() => setExpertCount(Math.max(1, expertCount - 1))} className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-slate-400 hover:text-white hover:bg-slate-700">-</button>
                 <span className="text-xs font-mono text-blue-400 w-4 text-center">{expertCount}</span>
                 <button onClick={() => setExpertCount(expertCount + 1)} className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-slate-400 hover:text-white hover:bg-slate-700">+</button>
               </div>
             </div>
          </div>
        </div>
      </div>


      {/* ---------------- 中间栏：可视化大屏 (55%) ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#020617] via-[#050914] to-[#0f172a] relative">
        
        {/* 顶部工具栏 */}
        <div className="h-14 border-b border-slate-800/60 flex items-center justify-between px-4 bg-[#020617]/90 backdrop-blur z-10 shadow-sm">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
              >
                {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>

              <div className="h-6 w-[1px] bg-slate-800/80 mx-1"></div>

              <div className="flex items-center gap-3">
                 <ShieldAlert className="text-blue-500" size={20} />
                 <h1 className="text-sm font-bold text-slate-100 tracking-wide hidden md:block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                   燃气PE管道风险评价模型 (Cloud Model)
                 </h1>
                 
                 {/* 风险状态徽章 */}
                 <div className={`ml-4 px-3 py-1 rounded-full text-[10px] font-bold ${conclusion.bg} ${conclusion.color} border ${conclusion.border} flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)] whitespace-nowrap transition-all duration-500`}>
                   {conclusion.level >= 3 ? <AlertTriangle size={12} className="animate-pulse" /> : <CheckCircle2 size={12} />}
                   {conclusion.text}
                 </div>
              </div>
           </div>

           {/* 视图切换 */}
           <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800/80">
             <button 
                onClick={() => setViewMode('viz')} 
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === 'viz' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <LayoutDashboard size={14} /> 云模型图谱
             </button>
             <button 
                onClick={() => setViewMode('table')} 
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <TableIcon size={14} /> 数据矩阵
             </button>
           </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'viz' ? (
             <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                
                {/* 综合云大图 - 添加双击事件 */}
                <div 
                  className="flex-1 min-h-[400px] bg-[#0b1221]/40 rounded-2xl border border-slate-800/50 p-1.5 relative group hover:border-blue-500/20 transition-colors shadow-2xl cursor-pointer"
                  onDoubleClick={() => setIsMaximized(true)}
                  title="双击放大"
                >
                   <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <div className="bg-black/40 backdrop-blur text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-700/50 flex items-center gap-1">
                        <Maximize2 size={10} /> 双击可放大查看细节
                      </div>
                   </div>
                   <CloudChart 
                      title="综合风险评价云图 (Comprehensive Cloud)" 
                      clouds={layers.filter(l => (l.type === 'final' || l.type === 'comment') && l.visible).map(l => ({ ...l, label: l.name }))} 
                      height={400} 
                   />
                </div>

                {/* 底部两个子图 */}
                <div className="h-[280px] grid grid-cols-2 gap-6">
                   <div className="bg-[#0b1221]/40 rounded-2xl border border-slate-800/50 p-1.5 hover:border-slate-700 transition-colors">
                      <CloudChart 
                        title="权重因子云分布 (Weight Cloud)" 
                        domain={[0, 10]}
                        clouds={layers.filter(l => l.type === 'weight' && l.visible).map(l => ({ ...l, label: l.name }))} 
                        height={270}
                        showYAxis={false}
                      />
                   </div>
                   <div className="bg-[#0b1221]/40 rounded-2xl border border-slate-800/50 p-1.5 hover:border-slate-700 transition-colors">
                      <CloudChart 
                        title="评价因子云分布 (Comment Cloud)" 
                        clouds={layers.filter(l => l.type === 'comment' && l.visible).map(l => ({ ...l, label: l.name }))} 
                        height={270}
                        showYAxis={false}
                      />
                   </div>
                </div>
             </div>
          ) : (
            /* 表格视图 */
            <div className="absolute inset-0 overflow-auto p-8 bg-[#03060e]">
               <div className="bg-[#0b1221] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700/60">
                      <th className="p-4 font-bold text-slate-300 w-64 border-r border-slate-800/50">二级指标项</th>
                      {Array.from({ length: expertCount }).map((_, i) => (
                        <th key={i} className="p-4 font-bold text-slate-400 text-center border-r border-slate-800/50 last:border-0">专家 {i+1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {indicators.map(ind => (
                      <React.Fragment key={ind.id}>
                        {/* 权重行 */}
                        <tr className="hover:bg-blue-900/5 group transition-colors">
                          <td className="p-3 pl-4 border-r border-slate-800/50 bg-[#0d1424]">
                            <div className="flex items-center gap-2">
                               <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                               <div>
                                 <div className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{ind.name}</div>
                                 <div className="text-[10px] text-slate-500 font-mono mt-0.5">参数类型: 权重 (Weight)</div>
                               </div>
                            </div>
                          </td>
                          {(ind as any).weightScores.map((score: number, idx: number) => (
                            <td key={idx} className="p-2 text-center border-r border-slate-800/50 last:border-0">
                              <input type="number" value={score} onChange={e => handleScoreChange(ind.id, 'weight', idx, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-slate-900/50 border border-transparent border-b-slate-700 rounded text-center text-blue-400 font-mono focus:border-blue-500 focus:bg-slate-800 outline-none transition-all hover:bg-slate-800/50" />
                            </td>
                          ))}
                        </tr>
                        {/* 评分行 */}
                        <tr className="hover:bg-emerald-900/5 group transition-colors bg-[#0a0f1a]/50">
                          <td className="p-3 pl-4 border-r border-slate-800/50">
                             <div className="flex items-center gap-2 pl-3 opacity-80">
                               <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                               <div className="text-[10px] text-emerald-500 font-bold">评分 (Score)</div>
                             </div>
                          </td>
                          {(ind as any).commentScores.map((score: number, idx: number) => (
                            <td key={idx} className="p-2 text-center border-r border-slate-800/50 last:border-0">
                              <input type="number" value={score} onChange={e => handleScoreChange(ind.id, 'comment', idx, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-slate-900/50 border border-transparent border-b-slate-700 rounded text-center text-emerald-400 font-mono focus:border-emerald-500 focus:bg-slate-800 outline-none transition-all hover:bg-slate-800/50" />
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ---------------- 右侧栏：属性与评分控制 (25%) ---------------- */}
      <div className="w-80 flex flex-col border-l border-slate-800/60 bg-[#060a15] z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
         
         <div className="h-14 px-6 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <Sliders size={16} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">实时评分面板</span>
            </div>
            <HelpCircle size={14} className="text-slate-600 cursor-help" />
         </div>

         {currentIndicator ? (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
               
               {/* 当前指标信息卡片 */}
               <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">当前编辑</span>
                     <button onClick={() => deleteIndicator(currentIndicator.id)} className="text-slate-600 hover:text-red-500 transition-colors p-1" title="删除当前指标">
                       <Trash2 size={14} />
                     </button>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug mb-1">{currentIndicator.name}</h3>
                  <div className="text-[10px] text-slate-500 font-mono">ID: {currentIndicator.id}</div>
                  
                  {/* 平均分展示 */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/50">
                     <div>
                        <div className="text-[10px] text-slate-500 mb-0.5">平均权重</div>
                        <div className="text-lg font-mono font-bold text-blue-400">
                          {((currentIndicator as any).weightScores.reduce((a:number,b:number)=>a+b,0)/expertCount).toFixed(2)}
                        </div>
                     </div>
                     <div>
                        <div className="text-[10px] text-slate-500 mb-0.5">平均得分</div>
                        <div className="text-lg font-mono font-bold text-emerald-400">
                          {((currentIndicator as any).commentScores.reduce((a:number,b:number)=>a+b,0)/expertCount).toFixed(1)}
                        </div>
                     </div>
                  </div>
               </div>

               {/* 权重滑块组 */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_currentColor]" />
                        <span className="text-xs font-bold text-blue-400">权重因子 (1-10)</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                    {currentIndicator.weightScores.map((score, i) => (
                       <div key={i} className="group">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                             <span className="font-medium group-hover:text-blue-300 transition-colors">专家 {i+1}</span>
                             <span className="font-mono text-slate-200 bg-slate-800 px-1.5 rounded">{score.toFixed(1)}</span>
                          </div>
                          <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full" style={{ width: `${(score/10)*100}%` }}></div>
                             <input 
                               type="range" min="1" max="10" step="0.1" value={score}
                               onChange={(e) => handleScoreChange(currentIndicator.id, 'weight', i, parseFloat(e.target.value))}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                          </div>
                       </div>
                    ))}
                  </div>
               </div>

               {/* 评价滑块组 */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]" />
                        <span className="text-xs font-bold text-emerald-400">风险评价 (0-100)</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                    {currentIndicator.commentScores.map((score, i) => (
                       <div key={i} className="group">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                             <span className="font-medium group-hover:text-emerald-300 transition-colors">专家 {i+1}</span>
                             <div className={`font-mono px-1.5 rounded text-[10px] ${score < 60 ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-200'}`}>
                               {score.toFixed(1)}
                             </div>
                          </div>
                          <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                             {/* 渐变色条：低分红，高分绿 */}
                             <div 
                                className={`absolute top-0 left-0 h-full rounded-full ${score < 60 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${score}%` }}
                             ></div>
                             <input 
                               type="range" min="0" max="100" step="0.5" value={score}
                               onChange={(e) => handleScoreChange(currentIndicator.id, 'comment', i, parseFloat(e.target.value))}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                          </div>
                       </div>
                    ))}
                  </div>
               </div>

            </div>
         ) : (
            /* 空状态提示 */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 p-8 text-center opacity-60">
               <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                  <MousePointerClick size={32} strokeWidth={1.5} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-1">未选择指标</h4>
                  <p className="text-xs">请点击左侧列表中的任意指标<br/>以查看详情和调整评分参数</p>
               </div>
            </div>
         )}
      </div>

    </div>
  );
};

export default RiskModule;
