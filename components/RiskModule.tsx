
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sliders, 
  Table as TableIcon,
  LayoutDashboard,
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
  HelpCircle,
  X,
  FileText,
  Upload,
  Paperclip,
  ExternalLink,
  Save,
  File,
  Download
} from 'lucide-react';
import * as d3 from 'd3';
import { CloudParams, Indicator } from '../types';
import { calculateCloudParams, aggregateClouds } from '../utils/cloudModel';
import CloudChart from './CloudChart';

// --- 类型定义扩充 ---
interface TertiaryIndicator {
  id: string;
  name: string;
  value: string; // 客观值 (无需评分，仅记录)
  source: string; // 依据来源
  pdfName?: string; // 上传的文件名
  fileUrl?: string; // 本地文件Blob URL
}

interface ExtendedIndicator extends Indicator {
  tertiary: TertiaryIndicator[];
}

interface CloudLayer {
  id: string;
  name: string;
  params: CloudParams;
  color: string;
  visible: boolean;
  type: 'weight' | 'comment' | 'final';
  indicatorId?: string;
}

// --- 数据初始化：B1-B5 体系 ---
const INITIAL_INDICATORS: ExtendedIndicator[] = [
  { 
    id: 'b1', name: 'B1 材料质量', 
    weightScores: [8.5, 9.0, 8.5, 9.0, 8.0], 
    commentScores: [92, 95, 90, 94, 91], 
    scores: [],
    tertiary: [
      { id: 'b1_1', name: '材料性能', value: 'PE100 RC', source: '出厂合格证 2023-A01', pdfName: '材料质保书.pdf' },
      { id: 'b1_2', name: '材料来源', value: '合格供应商库', source: '采购合同', pdfName: null },
      { id: 'b1_3', name: '管材结构', value: 'SDR11', source: '设计图纸', pdfName: null },
    ]
  },
  { 
    id: 'b2', name: 'B2 第三方损害', 
    weightScores: [9.5, 9.8, 9.2, 9.5, 9.0], 
    commentScores: [42, 38, 45, 40, 48], 
    scores: [],
    tertiary: [
      { id: 'b2_1', name: '地面施工', value: '频繁 (3处/km)', source: '巡检日志', pdfName: '施工现场记录.pdf' },
      { id: 'b2_2', name: '非法占压情况', value: '无明显占压', source: '无人机巡查报告', pdfName: null },
      { id: 'b2_3', name: '安全监管情况', value: '良好', source: '第三方监管协议', pdfName: null },
    ]
  },
  { 
    id: 'b3', name: 'B3 地质与环境', 
    weightScores: [6.0, 6.5, 6.0, 5.5, 6.5], 
    commentScores: [58, 62, 55, 60, 56], 
    scores: [],
    tertiary: [
      { id: 'b3_1', name: '土壤环境情况', value: '弱腐蚀性', source: '土壤勘察报告', pdfName: '岩土工程勘察.pdf' },
      { id: 'b3_2', name: '地下水位情况', value: '2.5m', source: '水文监测数据', pdfName: null },
      { id: 'b3_3', name: '埋设深度情况', value: '平均 1.2m', source: '竣工测量图', pdfName: null },
    ]
  },
  { 
    id: 'b4', name: 'B4 运营管理', 
    weightScores: [7.5, 7.0, 8.0, 7.5, 7.0], 
    commentScores: [75, 72, 78, 74, 76], 
    scores: [],
    tertiary: [
      { id: 'b4_1', name: '压力稳定性', value: '波动 <5%', source: 'SCADA历史数据', pdfName: '压力曲线图.pdf' },
      { id: 'b4_2', name: '人员操作水平', value: '持证率 100%', source: '人员培训档案', pdfName: null },
      { id: 'b4_3', name: '操作技能情况', value: '考核优秀', source: '年度技能比武结果', pdfName: null },
    ]
  },
  { 
    id: 'b5', name: 'B5 检测与维护', 
    weightScores: [5.0, 5.5, 5.0, 5.2, 4.8], 
    commentScores: [85, 82, 88, 84, 86], 
    scores: [],
    tertiary: [
      { id: 'b5_1', name: '巡检状况', value: '每日一次', source: 'GPS巡检系统', pdfName: '巡检轨迹.pdf' },
      { id: 'b5_2', name: '维修情况', value: '及时修复', source: '抢修工单', pdfName: null },
      { id: 'b5_3', name: '管道隐患情况', value: '2处 (已整改)', source: '隐患排查台账', pdfName: null },
    ]
  }
];

const RiskModule: React.FC = () => {
  // 核心数据
  const [indicators, setIndicators] = useState<ExtendedIndicator[]>(INITIAL_INDICATORS);
  
  const [viewMode, setViewMode] = useState<'viz' | 'table'>('viz');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(indicators[0]?.id || null);
  const [valueCount, setValueCount] = useState(5); // 客观值数量
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 模态框状态
  const [isMaximized, setIsMaximized] = useState(false); 
  const [detailModalIndicatorId, setDetailModalIndicatorId] = useState<string | null>(null);

  // 文件上传 Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{parentId: string, tId: string} | null>(null);

  // 计算图层数据
  const layers = useMemo(() => {
    const list: CloudLayer[] = [];
    const colors = d3.schemeTableau10;

    indicators.forEach((ind, i) => {
      const wParams = calculateCloudParams(ind.weightScores);
      const cParams = calculateCloudParams(ind.commentScores);
      
      const wId = `w_${ind.id}`;
      const cId = `c_${ind.id}`;
      const color = colors[i % colors.length];

      list.push({
        id: wId,
        name: `${ind.name} (权重)`,
        params: wParams,
        color: color,
        visible: !hiddenLayerIds.has(wId),
        type: 'weight',
        indicatorId: ind.id
      });
      
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

    const wClouds = indicators.map(ind => calculateCloudParams(ind.weightScores));
    const cClouds = indicators.map(ind => calculateCloudParams(ind.commentScores));
    
    if (wClouds.length > 0) {
      const final = aggregateClouds(cClouds, wClouds);
      const fId = 'final_risk';
      list.push({
        id: fId,
        name: '综合风险云 (最终结果)',
        params: final,
        color: '#ffffff', 
        visible: !hiddenLayerIds.has(fId),
        type: 'final'
      });
    }

    return list;
  }, [indicators, hiddenLayerIds]);

  // 综合结论
  const conclusion = useMemo(() => {
    const final = layers.find(l => l.id === 'final_risk')?.params;
    if (!final) return { text: '暂无数据', level: 0, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
    const ex = final.ex;
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

  // 三级指标更新函数
  const handleTertiaryUpdate = (parentId: string, tId: string, field: keyof TertiaryIndicator, value: any) => {
    setIndicators(prev => prev.map(ind => {
      if (ind.id === parentId) {
        return {
          ...ind,
          tertiary: ind.tertiary.map(t => t.id === tId ? { ...t, [field]: value } : t)
        };
      }
      return ind;
    }));
  };

  // 触发文件选择
  const triggerFileUpload = (parentId: string, tId: string) => {
    setUploadTarget({ parentId, tId });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // 清空之前的值
      fileInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadTarget) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file); // 创建本地 Blob URL
      
      setIndicators(prev => prev.map(ind => {
        if (ind.id === uploadTarget.parentId) {
          return {
            ...ind,
            tertiary: ind.tertiary.map(t => t.id === uploadTarget.tId ? { 
                ...t, 
                pdfName: file.name,
                fileUrl: fileUrl 
            } : t)
          };
        }
        return ind;
      }));
      setUploadTarget(null);
    }
  };

  const currentIndicator = indicators.find(i => i.id === selectedIndicatorId);
  const detailedIndicator = indicators.find(i => i.id === detailModalIndicatorId);

  return (
    <div className="flex h-full bg-[#020617] text-slate-300 font-sans overflow-hidden select-none relative">
      
      {/* 隐藏的文件上传 Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf" 
        className="hidden" 
      />

      {/* ---------------- 1. 放大视图 Modal (图表) ---------------- */}
      {isMaximized && (
        <div className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
           <div className="w-full h-full max-w-6xl max-h-[90vh] bg-[#0b1221] border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col p-2">
               <button onClick={() => setIsMaximized(false)} className="absolute top-4 right-4 z-20 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-700 shadow-lg">
                  <X size={24} />
               </button>
               <div className="flex-1 overflow-hidden rounded-xl bg-slate-950/50">
                   <CloudChart 
                      title="综合风险评价云图 (详细透视)" 
                      clouds={layers.filter(l => (l.type === 'final' || l.type === 'comment') && l.visible).map(l => ({ ...l, label: l.name }))} 
                      height={700}
                   />
               </div>
           </div>
        </div>
      )}

      {/* ---------------- 2. 三级指标详情 Modal (交互核心 - 放大版) ---------------- */}
      {detailedIndicator && (
        <div className="absolute inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           {/* 加大了宽高：w-[90vw] h-[85vh] */}
           <div className="w-[90vw] max-w-7xl h-[85vh] bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="h-20 px-8 border-b border-slate-700 flex items-center justify-between bg-slate-900">
                 <div className="flex items-center gap-6">
                    <div className="bg-blue-600/20 p-3 rounded-xl text-blue-400">
                       <FileText size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-wide">{detailedIndicator.name} - 详细数据</h2>
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <span>客观具体值与打分依据凭证</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        <span>共 {detailedIndicator.tertiary.length} 项指标</span>
                      </div>
                    </div>
                 </div>
                 <button onClick={() => setDetailModalIndicatorId(null)} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                    <X size={28} />
                 </button>
              </div>
              
              {/* Modal Body: Tertiary List */}
              <div className="flex-1 overflow-y-auto p-10 bg-[#0b1221]">
                 <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                       <tr className="text-slate-500 text-base uppercase tracking-wider">
                          <th className="pb-4 pl-6 font-semibold">三级指标名称</th>
                          <th className="pb-4 font-semibold w-1/4">客观具体值 (Objective Value)</th>
                          <th className="pb-4 font-semibold w-1/4">打分/判断依据来源</th>
                          <th className="pb-4 text-center font-semibold w-64">凭证文件 (PDF)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {detailedIndicator.tertiary.map((item) => (
                          <tr key={item.id} className="bg-slate-900/50 hover:bg-slate-800/80 transition-all duration-200 group shadow-md hover:shadow-lg">
                             <td className="p-6 rounded-l-xl border-y border-l border-slate-800 font-medium text-slate-200 text-lg">
                                <div className="flex items-center gap-4">
                                   <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                                   {item.name}
                                </div>
                             </td>
                             <td className="p-6 border-y border-slate-800">
                                <input 
                                   type="text" 
                                   value={item.value}
                                   onChange={(e) => handleTertiaryUpdate(detailedIndicator.id, item.id, 'value', e.target.value)}
                                   className="w-full bg-black/30 border border-slate-700/80 rounded-lg px-4 py-3 text-emerald-400 font-mono text-lg focus:border-blue-500 focus:bg-slate-900 outline-none transition-colors shadow-inner"
                                />
                             </td>
                             <td className="p-6 border-y border-slate-800">
                                <input 
                                   type="text" 
                                   value={item.source}
                                   onChange={(e) => handleTertiaryUpdate(detailedIndicator.id, item.id, 'source', e.target.value)}
                                   className="w-full bg-black/30 border border-slate-700/80 rounded-lg px-4 py-3 text-slate-300 text-base focus:border-blue-500 focus:bg-slate-900 outline-none transition-colors shadow-inner"
                                   placeholder="例如: 测试报告、现场数据..."
                                />
                             </td>
                             <td className="p-6 rounded-r-xl border-y border-r border-slate-800 text-center">
                                {item.pdfName ? (
                                   <div className="flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-200">
                                      <a 
                                        href={item.fileUrl || '#'} 
                                        download={item.pdfName}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => {
                                            if (!item.fileUrl) {
                                                e.preventDefault();
                                                alert("此为系统演示数据，暂无实际文件。\n请使用“上传PDF”功能测试文件下载。");
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm cursor-pointer hover:bg-red-900/50 hover:border-red-700 transition-colors group/file" 
                                        title="点击下载/查看"
                                      >
                                         <File size={16} />
                                         <span className="truncate max-w-[120px] font-medium">{item.pdfName}</span>
                                         <Download size={14} className="opacity-50 group-hover/file:opacity-100" />
                                      </a>
                                      <button onClick={() => handleTertiaryUpdate(detailedIndicator.id, item.id, 'pdfName', '')} className="text-slate-600 hover:text-red-400 p-2 rounded-full hover:bg-slate-800 transition-colors" title="删除文件">
                                        <X size={18} />
                                      </button>
                                   </div>
                                ) : (
                                   <button 
                                     onClick={() => triggerFileUpload(detailedIndicator.id, item.id)}
                                     className="flex items-center justify-center gap-2 text-slate-500 hover:text-blue-400 text-sm mx-auto px-5 py-2.5 rounded-lg border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-900/10 transition-all font-medium"
                                   >
                                      <Upload size={16} /> <span>上传凭证 PDF</span>
                                   </button>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-700 bg-slate-900 flex justify-end gap-4">
                 <button onClick={() => setDetailModalIndicatorId(null)} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-base font-medium transition-colors">
                    取消
                 </button>
                 <button onClick={() => setDetailModalIndicatorId(null)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
                    <Save size={18} /> 保存并关闭
                 </button>
              </div>
           </div>
        </div>
      )}


      {/* ---------------- 左侧栏：导航与控制 (20%) ---------------- */}
      <div 
        className={`${isSidebarOpen ? 'w-72 border-r' : 'w-0 border-none'} flex flex-col border-slate-800/60 bg-[#060a15] transition-all duration-300 overflow-hidden relative shadow-xl z-20`}
      >
        <div className="min-w-[18rem] h-full flex flex-col"> 
          
          <div className="h-14 px-4 border-b border-slate-800/60 flex items-center justify-between bg-[#060a15] sticky top-0 z-10">
             <div className="flex items-center gap-2.5 text-slate-100">
               <div className="p-1.5 bg-blue-600/20 rounded-md">
                 <Layers size={16} className="text-blue-400"/>
               </div>
               <span className="text-sm font-bold tracking-wide">评价指标体系</span>
             </div>
          </div>

          <div className="px-4 pt-5 pb-2">
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-3 shadow-inner">
                 <div className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" /> 
                    <span>综合风险评估结果</span>
                 </div>
                 {layers.filter(l => l.type === 'final').map(layer => (
                   <div key={layer.id} className="flex items-center justify-between bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                        <span className="text-sm text-slate-200 font-medium">综合云 (Final Cloud)</span>
                      </div>
                      <button 
                        onClick={(e) => toggleVisibility(layer.id, e)} 
                        className={`p-1.5 rounded-md transition-all ${layer.visible ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'}`} 
                      >
                          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                   </div>
                 ))}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-scrollbar">
             <div className="flex justify-between items-end px-1 mb-2 border-b border-slate-800/50 pb-1">
               <span className="text-xs font-bold text-slate-500 uppercase">二级指标 ({indicators.length})</span>
               <span className="text-xs text-slate-600">显隐控制</span>
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
                   {isSelected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                   
                   <div className="flex flex-col gap-2 pl-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: indicatorColor }} />
                           <span className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                             {ind.name}
                           </span>
                        </div>
                        {isSelected && <ChevronRight size={14} className="text-blue-500/50" />}
                      </div>

                      <div className="flex gap-2 mt-1">
                        {wLayer && (
                          <button 
                            onClick={(e) => toggleVisibility(wLayer.id, e)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs border transition-all ${
                              wLayer.visible 
                               ? 'bg-slate-700/50 text-slate-200 border-slate-600' 
                               : 'bg-slate-900/50 text-slate-600 border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                             <div className={`w-1.5 h-1.5 rounded-full ${wLayer.visible ? 'bg-blue-400 shadow-[0_0_5px_currentColor]' : 'border border-slate-500'}`} />
                             权重
                          </button>
                        )}
                        {cLayer && (
                          <button 
                            onClick={(e) => toggleVisibility(cLayer.id, e)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs border transition-all ${
                              cLayer.visible 
                               ? 'bg-slate-700/50 text-slate-200 border-slate-600' 
                               : 'bg-slate-900/50 text-slate-600 border-slate-800 opacity-60 hover:opacity-100'
                            }`}
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

          <div className="p-4 border-t border-slate-800/60 bg-[#050810]">
             <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
               <User size={14} className="text-slate-500"/>
               <span className="text-sm text-slate-400 flex-1">客观样本数量</span>
               <div className="flex items-center gap-2">
                 <button onClick={() => setValueCount(Math.max(1, valueCount - 1))} className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-slate-400 hover:text-white hover:bg-slate-700">-</button>
                 <span className="text-sm font-mono text-blue-400 w-4 text-center">{valueCount}</span>
                 <button onClick={() => setValueCount(valueCount + 1)} className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-slate-400 hover:text-white hover:bg-slate-700">+</button>
               </div>
             </div>
          </div>
        </div>
      </div>


      {/* ---------------- 中间栏：可视化大屏 (55%) ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#020617] via-[#050914] to-[#0f172a] relative">
        
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
                 
                 <div className={`ml-4 px-3 py-1 rounded-full text-xs font-bold ${conclusion.bg} ${conclusion.color} border ${conclusion.border} flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)] whitespace-nowrap transition-all duration-500`}>
                   {conclusion.level >= 3 ? <AlertTriangle size={12} className="animate-pulse" /> : <CheckCircle2 size={12} />}
                   {conclusion.text}
                 </div>
              </div>
           </div>

           <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800/80">
             <button 
                onClick={() => setViewMode('viz')} 
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'viz' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <LayoutDashboard size={14} /> 云模型图谱
             </button>
             <button 
                onClick={() => setViewMode('table')} 
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <TableIcon size={14} /> 数据矩阵
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'viz' ? (
             <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                
                <div 
                  className="flex-1 min-h-[400px] bg-[#0b1221]/40 rounded-2xl border border-slate-800/50 p-1.5 relative group hover:border-blue-500/20 transition-colors shadow-2xl cursor-pointer"
                  onDoubleClick={() => setIsMaximized(true)}
                  title="双击放大"
                >
                   <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <div className="bg-black/40 backdrop-blur text-xs text-slate-400 px-2 py-1 rounded border border-slate-700/50 flex items-center gap-1">
                        <Maximize2 size={10} /> 双击可放大查看细节
                      </div>
                   </div>
                   <CloudChart 
                      title="综合风险评价云图 (Comprehensive Cloud)" 
                      clouds={layers.filter(l => (l.type === 'final' || l.type === 'comment') && l.visible).map(l => ({ ...l, label: l.name }))} 
                      height={400} 
                   />
                </div>

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
            /* 数据矩阵视图 (Table) - 终极全屏大尺寸版 (优化后密度) */
            <div className="absolute inset-0 overflow-hidden bg-[#03060e] flex flex-col">
               <div className="flex-1 overflow-auto p-4">
                  <div className="min-h-full bg-[#0b1221] border border-slate-800 rounded-xl shadow-2xl flex flex-col">
                    <table className="w-full text-left border-collapse h-full">
                      <thead className="sticky top-0 z-10 bg-slate-900 shadow-md">
                        <tr className="border-b border-slate-700/60">
                          <th className="p-4 font-bold text-slate-200 text-base w-72 border-r border-slate-800/50 tracking-wide">
                            二级指标项 <span className="text-slate-500 text-sm font-normal ml-2">(点击查看明细)</span>
                          </th>
                          {Array.from({ length: valueCount }).map((_, i) => (
                            <th key={i} className="p-4 font-bold text-slate-400 text-base text-center border-r border-slate-800/50 last:border-0">
                              客观值 {i+1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 bg-[#0b1221]">
                        {indicators.map(ind => (
                          <React.Fragment key={ind.id}>
                            {/* 权重行 */}
                            <tr className="hover:bg-blue-900/5 group transition-colors">
                              <td 
                                className="p-3 pl-6 border-r border-slate-800/50 bg-[#0d1424] cursor-pointer hover:bg-slate-800 transition-colors relative"
                                onClick={() => setDetailModalIndicatorId(ind.id)}
                                title="点击查看三级指标详情和依据"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600/50 group-hover:bg-blue-500 transition-colors"></div>
                                <div>
                                    <div className="font-bold text-slate-200 text-base group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                      {ind.name} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <div className="text-sm text-slate-500 font-mono mt-0.5">参数类型: 权重 (Weight)</div>
                                </div>
                              </td>
                              {(ind as any).weightScores.map((score: number, idx: number) => (
                                <td key={idx} className="p-2 text-center border-r border-slate-800/50 last:border-0 align-middle">
                                  <input 
                                    type="number" 
                                    value={score} 
                                    onChange={e => handleScoreChange(ind.id, 'weight', idx, parseFloat(e.target.value) || 0)}
                                    className="w-full h-11 bg-slate-900/50 border border-transparent border-b border-b-slate-700/50 rounded-md text-center text-blue-400 text-lg font-mono focus:border-b-blue-500 focus:bg-slate-800 outline-none transition-all hover:bg-slate-800/30" 
                                  />
                                </td>
                              ))}
                            </tr>
                            {/* 评分行 */}
                            <tr className="hover:bg-emerald-900/5 group transition-colors bg-[#0a0f1a]/50">
                              <td className="p-3 pl-6 border-r border-slate-800/50 align-middle">
                                <div className="flex items-center gap-2 pl-1 opacity-80">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_currentColor]"></div>
                                  <div className="text-sm text-emerald-500 font-bold tracking-wider">客观评分 (Score)</div>
                                </div>
                              </td>
                              {(ind as any).commentScores.map((score: number, idx: number) => (
                                <td key={idx} className="p-2 text-center border-r border-slate-800/50 last:border-0 align-middle">
                                  <input 
                                    type="number" 
                                    value={score} 
                                    onChange={e => handleScoreChange(ind.id, 'comment', idx, parseFloat(e.target.value) || 0)}
                                    className="w-full h-11 bg-slate-900/50 border border-transparent border-b border-b-slate-700/50 rounded-md text-center text-emerald-400 text-lg font-mono focus:border-b-emerald-500 focus:bg-slate-800 outline-none transition-all hover:bg-slate-800/30" 
                                  />
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              <span className="text-sm font-bold uppercase tracking-wider">实时面板</span>
            </div>
            <HelpCircle size={14} className="text-slate-600 cursor-help" />
         </div>

         {currentIndicator ? (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
               
               <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">当前编辑</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug mb-1">{currentIndicator.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/50">
                     <div>
                        <div className="text-xs text-slate-500 mb-0.5">平均权重</div>
                        <div className="text-lg font-mono font-bold text-blue-400">
                          {((currentIndicator as any).weightScores.reduce((a:number,b:number)=>a+b,0)/valueCount).toFixed(2)}
                        </div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500 mb-0.5">平均得分</div>
                        <div className="text-lg font-mono font-bold text-emerald-400">
                          {((currentIndicator as any).commentScores.reduce((a:number,b:number)=>a+b,0)/valueCount).toFixed(1)}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_currentColor]" />
                        <span className="text-sm font-bold text-blue-400">权重因子 (1-10)</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                    {currentIndicator.weightScores.map((score, i) => (
                       <div key={i} className="group">
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                             <span className="font-medium group-hover:text-blue-300 transition-colors">样本 {i+1}</span>
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

               <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]" />
                        <span className="text-sm font-bold text-emerald-400">风险评价 (0-100)</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                    {currentIndicator.commentScores.map((score, i) => (
                       <div key={i} className="group">
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                             <span className="font-medium group-hover:text-emerald-300 transition-colors">样本 {i+1}</span>
                             <div className={`font-mono px-1.5 rounded text-xs ${score < 60 ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-200'}`}>
                               {score.toFixed(1)}
                             </div>
                          </div>
                          <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 p-8 text-center opacity-60">
               <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                  <MousePointerClick size={32} strokeWidth={1.5} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-1">未选择指标</h4>
                  <p className="text-sm">请点击左侧列表中的任意指标<br/>以查看详情和调整评分参数</p>
               </div>
            </div>
         )}
      </div>

    </div>
  );
};

export default RiskModule;
