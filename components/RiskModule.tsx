
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Settings2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sliders, 
  ChevronRight,
  Info,
  Table as TableIcon,
  LayoutDashboard,
  Plus,
  Save,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import * as d3 from 'd3';
import { CloudParams, Indicator } from '../types';
import { DEFAULT_RISK_INDICATORS } from '../constants';
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

const RiskModule: React.FC = () => {
  // 核心数据：指标及专家评分
  const [indicators, setIndicators] = useState<Indicator[]>(
    DEFAULT_RISK_INDICATORS.map(ind => ({ 
      ...ind, 
      weightScores: [7, 6, 8, 7, 6], 
      commentScores: [82, 75, 88, 80, 78] 
    })) as any
  );
  
  const [viewMode, setViewMode] = useState<'viz' | 'table'>('viz');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(indicators[0]?.id || null);
  const [expertCount, setExpertCount] = useState(5);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());

  // 计算图层数据
  const layers = useMemo(() => {
    const list: CloudLayer[] = [];
    
    indicators.forEach((ind, i) => {
      const wParams = calculateCloudParams((ind as any).weightScores || []);
      const cParams = calculateCloudParams((ind as any).commentScores || []);
      
      const wId = `w_${ind.id}`;
      list.push({
        id: wId,
        name: `${ind.name}-权重`,
        params: wParams,
        color: d3.schemeTableau10[i % 10],
        visible: !hiddenLayerIds.has(wId),
        type: 'weight',
        indicatorId: ind.id
      });
      
      const cId = `c_${ind.id}`;
      list.push({
        id: cId,
        name: `${ind.name}-评价`,
        params: cParams,
        color: d3.schemeTableau10[i % 10],
        visible: !hiddenLayerIds.has(cId),
        type: 'comment',
        indicatorId: ind.id
      });
    });

    const wClouds = indicators.map(ind => calculateCloudParams((ind as any).weightScores || []));
    const cClouds = indicators.map(ind => calculateCloudParams((ind as any).commentScores || []));
    
    if (wClouds.length > 0) {
      const final = aggregateClouds(cClouds, wClouds);
      const fId = 'final_risk';
      list.push({
        id: fId,
        name: '燃气PE管道综合风险云',
        params: final,
        color: '#3b82f6',
        visible: !hiddenLayerIds.has(fId),
        type: 'final'
      });
    }

    return list;
  }, [indicators, hiddenLayerIds]);

  // 综合评价结论
  const conclusion = useMemo(() => {
    const final = layers.find(l => l.id === 'final_risk')?.params;
    if (!final) return { text: '数据不足', color: 'text-slate-500', bg: 'bg-slate-500/10' };
    const ex = final.ex;
    if (ex > 85) return { text: '极高风险', color: 'text-red-500', bg: 'bg-red-500/20' };
    if (ex > 70) return { text: '高风险', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    if (ex > 50) return { text: '中等风险', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { text: '低风险', color: 'text-emerald-500', bg: 'bg-emerald-500/20' };
  }, [layers]);

  // 操作函数
  const toggleVisibility = (id: string) => {
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
      commentScores: Array(expertCount).fill(50)
    };
    setIndicators(prev => [...prev, newInd]);
  };

  return (
    <div className="flex h-full bg-[#070b14] text-slate-300 overflow-hidden font-sans">
      
      {/* 侧边栏：图层与模型管理 */}
      <div className="w-64 border-r border-slate-800 bg-[#0d1421] flex flex-col z-10">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-blue-500" size={16} />
            <h2 className="font-bold text-xs tracking-widest text-white uppercase">图层控制</h2>
          </div>
          <button onClick={addNewIndicator} className="p-1 hover:bg-slate-800 rounded text-blue-400"><Plus size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
          {/* 综合层 */}
          <div>
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">综合评价结果</div>
            {layers.filter(l => l.type === 'final').map(layer => (
              <LayerControlItem 
                key={layer.id} 
                layer={layer} 
                onToggle={() => toggleVisibility(layer.id)}
                onDelete={() => {}} // 综合层不可删
              />
            ))}
          </div>

          {/* 指标层 */}
          <div>
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">指标分量 (W & C)</div>
            {indicators.map((ind, i) => {
              const wLayer = layers.find(l => l.id === `w_${ind.id}`);
              const cLayer = layers.find(l => l.id === `c_${ind.id}`);
              return (
                <div key={ind.id} className="mb-2 group p-1 rounded-lg hover:bg-slate-800/30 border border-transparent hover:border-slate-800 transition-all">
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-400 truncate">{ind.name}</span>
                    <button onClick={() => deleteIndicator(ind.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                  </div>
                  <div className="space-y-1">
                    {wLayer && <LayerControlItem layer={wLayer} compact onToggle={() => toggleVisibility(wLayer.id)} />}
                    {cLayer && <LayerControlItem layer={cLayer} compact onToggle={() => toggleVisibility(cLayer.id)} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 参数编辑 */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
           <div className="flex items-center gap-2 mb-3">
             <Sliders size={14} className="text-blue-400" />
             <h3 className="text-xs font-bold text-white uppercase tracking-wider">全局配置</h3>
           </div>
           <div className="space-y-3">
             <div>
               <label className="text-[10px] text-slate-500 block mb-1">专家团队规模</label>
               <input 
                type="number" 
                value={expertCount} 
                onChange={e => setExpertCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-blue-400 font-mono"
               />
             </div>
             <div className="p-2 bg-blue-500/5 rounded text-[9px] text-slate-500 italic leading-relaxed">
               改变专家规模后，请在数据视图补充新专家的评分数据。
             </div>
           </div>
        </div>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 顶部导航 */}
        <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-[#0a0f18]/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-white tracking-wide">风险评价决策平台</h1>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${conclusion.bg} ${conclusion.color} border border-current opacity-80`}>
              当前状态: {conclusion.text}
            </div>
          </div>
          
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-inner">
            <button 
              onClick={() => setViewMode('viz')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded transition-all ${viewMode === 'viz' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutDashboard size={14} /> 可视化看板
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <TableIcon size={14} /> 专家评分表
            </button>
          </div>
        </div>

        {/* 内容展示区 */}
        <div className="flex-1 relative overflow-hidden flex">
          
          {viewMode === 'viz' ? (
            <>
              {/* 可视化面板 */}
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="h-[400px] min-h-[400px]">
                  <CloudChart 
                    title="燃气PE管道综合风险态势" 
                    clouds={layers.filter(l => (l.type === 'final' || l.type === 'comment') && l.visible).map(l => ({ ...l, label: l.name }))} 
                    height={400} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6 h-[250px] min-h-[250px]">
                  <CloudChart 
                    title="二级指标权重分布 (WCM)" 
                    domain={[0, 10]}
                    clouds={layers.filter(l => l.type === 'weight' && l.visible).map(l => ({ ...l, label: l.name }))} 
                    height={250}
                    showYAxis={false}
                  />
                  <CloudChart 
                    title="二级指标评价值分布 (CCM)" 
                    clouds={layers.filter(l => l.type === 'comment' && l.visible).map(l => ({ ...l, label: l.name }))} 
                    height={250}
                    showYAxis={false}
                  />
                </div>
              </div>

              {/* 右侧即时编辑浮窗 */}
              <div className="w-80 border-l border-slate-800 bg-[#0d1421]/80 backdrop-blur p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-white border-b border-slate-800 pb-2">
                  <UserCheck size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase">即时评分调节</span>
                </div>
                
                <div className="mb-4">
                  <select 
                    value={selectedIndicatorId || ''} 
                    onChange={e => setSelectedIndicatorId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs rounded px-2 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="">-- 选择指标 --</option>
                    {indicators.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                  </select>
                </div>

                {selectedIndicatorId && (
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                    <ScoreSliderGroup 
                      title="权重评分 (1-10)" 
                      scores={(indicators.find(i => i.id === selectedIndicatorId) as any).weightScores || []}
                      expertCount={expertCount}
                      onScoreChange={(idx, val) => handleScoreChange(selectedIndicatorId, 'weight', idx, val)}
                      accentColor="blue"
                    />
                    <ScoreSliderGroup 
                      title="风险评分 (0-100)" 
                      scores={(indicators.find(i => i.id === selectedIndicatorId) as any).commentScores || []}
                      expertCount={expertCount}
                      onScoreChange={(idx, val) => handleScoreChange(selectedIndicatorId, 'comment', idx, val)}
                      accentColor="emerald"
                    />
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-800">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                     <AlertTriangle size={10} className="text-yellow-600" />
                     <span>调整分值将实时重绘左侧云图分布。</span>
                   </div>
                </div>
              </div>
            </>
          ) : (
            /* 数据表视图 */
            <div className="flex-1 p-8 overflow-auto">
              <div className="bg-[#0d1421] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      <th className="p-4 font-bold text-slate-100 uppercase tracking-widest w-48">二级指标名称</th>
                      {Array.from({ length: expertCount }).map((_, i) => (
                        <th key={i} className="p-4 font-bold text-slate-400 text-center border-l border-slate-700/50">专家 E{i+1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {indicators.map(ind => (
                      <React.Fragment key={ind.id}>
                        {/* 权重行 */}
                        <tr className="hover:bg-slate-800/20 group">
                          <td className="p-4 border-r border-slate-700/50">
                            <div className="font-bold text-slate-200">{ind.name}</div>
                            <div className="text-[9px] text-blue-500 font-bold mt-1">权重集 (Weight)</div>
                          </td>
                          {(ind as any).weightScores.map((score: number, idx: number) => (
                            <td key={idx} className="p-2 text-center border-l border-slate-700/30">
                              <input 
                                type="number" 
                                value={score} 
                                onChange={e => handleScoreChange(ind.id, 'weight', idx, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-center text-blue-400 font-mono focus:border-blue-500 outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                        {/* 评分行 */}
                        <tr className="hover:bg-slate-800/20 bg-slate-900/10">
                          <td className="p-4 border-r border-slate-700/50">
                            <div className="text-[9px] text-emerald-500 font-bold">评价集 (Comment)</div>
                          </td>
                          {(ind as any).commentScores.map((score: number, idx: number) => (
                            <td key={idx} className="p-2 text-center border-l border-slate-700/30">
                              <input 
                                type="number" 
                                value={score} 
                                onChange={e => handleScoreChange(ind.id, 'comment', idx, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-center text-emerald-400 font-mono focus:border-emerald-500 outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm border border-slate-700 transition-all">
                  <Save size={16} /> 导出为 CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- 辅助组件 --- */

const LayerControlItem = ({ layer, onToggle, onDelete, compact }: { layer: CloudLayer, onToggle: () => void, onDelete?: () => void, compact?: boolean }) => (
  <div 
    className={`group flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer transition-all ${layer.visible ? 'hover:bg-slate-800/50' : 'opacity-40 hover:opacity-100'}`}
  >
    <div className="flex items-center gap-2 overflow-hidden" onClick={onToggle}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color, boxShadow: layer.visible ? `0 0 6px ${layer.color}` : 'none' }} />
      <span className={`text-[10px] truncate max-w-[120px] ${layer.visible ? 'text-slate-300' : 'text-slate-500 line-through'}`}>
        {layer.name}
      </span>
    </div>
    <div className="flex items-center gap-1">
       <button onClick={onToggle} className="p-1 text-slate-600 hover:text-white transition-colors">
         {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
       </button>
       {onDelete && !compact && (
         <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
           <Trash2 size={12} />
         </button>
       )}
    </div>
  </div>
);

const ScoreSliderGroup = ({ title, scores, expertCount, onScoreChange, accentColor }: { title: string, scores: number[], expertCount: number, onScoreChange: (idx: number, val: number) => void, accentColor: 'blue' | 'emerald' }) => (
  <div className="space-y-3">
    <h4 className={`text-[10px] font-bold uppercase tracking-widest ${accentColor === 'blue' ? 'text-blue-500' : 'text-emerald-500'}`}>{title}</h4>
    {Array.from({ length: expertCount }).map((_, i) => (
      <div key={i} className="space-y-1">
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>专家 E{i+1}</span>
          <span className="font-mono text-slate-300">{scores[i]?.toFixed(1) || '0.0'}</span>
        </div>
        <input 
          type="range" 
          min={title.includes('权重') ? 1 : 0} 
          max={title.includes('权重') ? 10 : 100} 
          step={0.1}
          value={scores[i] || 0}
          onChange={(e) => onScoreChange(i, parseFloat(e.target.value))}
          className={`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-${accentColor}-500`}
        />
      </div>
    ))}
  </div>
);

export default RiskModule;
