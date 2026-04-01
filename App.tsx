
import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Settings, 
  Save, 
  Trash2, 
  Search, 
  Database,
  LayoutTemplate,
  PlusCircle,
  Link2,
  FileJson,
  MousePointer2,
  ShieldAlert,
  BarChart4,
  Upload
} from 'lucide-react';
import GraphCanvas from './components/GraphCanvas';
import RiskModule from './components/RiskModule';
import NodeDetailPanel from './components/NodeDetailPanel';
import { GraphData, GraphNode, NodeType } from './types';
import { INITIAL_DATA, NODE_LABELS_ZH, NODE_COLORS, GRAPH_TEMPLATES } from './constants';

const inferNodeType = (label: string): NodeType => {
  if (/(管|PE|钢)/.test(label) && !/(管理|人员)/.test(label)) return NodeType.PIPE;
  if (/(阀|泵|表|计|缸|设备)/.test(label)) return NodeType.VALVE;
  if (/(站|厂|库|系统)/.test(label)) return NodeType.STATION;
  if (/(接头|法兰|三通|弯头|管件|警示带|示踪线|装置)/.test(label)) return NodeType.FITTING;
  if (/(风险|泄漏|腐蚀|隐患|违规|破坏|事故|报警|检测|试验|测试|评估|占压|施工)/.test(label)) return NodeType.RISK;
  if (/(位置|坐标|区|路|街|村|镇|市|省|环境|土壤|深度|河流|交通)/.test(label)) return NodeType.LOCATION;
  if (/(人|工|员|公司|单位|局|商|长|张|李|王|赵)/.test(label)) return NodeType.PERSON;
  if (/(文件|记录|报告|证|书|规范|标准|图|表|数据|参数|温度|压力|时间|速率|率|寿命|批号)/.test(label)) return NodeType.DOCUMENT;
  return NodeType.UNKNOWN;
};

const App: React.FC = () => {
  const [view, setView] = useState<'graph' | 'risk'>('graph');
  const [graphData, setGraphData] = useState<GraphData>(INITIAL_DATA);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Manual Input State
  const [activeTab, setActiveTab] = useState<'node' | 'link'>('node');
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.PIPE);
  const [newLinkSource, setNewLinkSource] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('demo');

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLoadTemplate = () => {
    const template = GRAPH_TEMPLATES[selectedTemplate];
    if (template) {
      const newData = JSON.parse(JSON.stringify(template));
      setGraphData(newData);
      setSelectedNode(null);
      showNotification(`已加载 "${selectedTemplate}" 模组数据`, 'success');
    }
  };

  const handleAddNode = () => {
    if (!newNodeLabel.trim()) {
      showNotification("请输入节点名称", 'error');
      return;
    }
    const newNode: GraphNode = {
      id: `manual_${Date.now()}`,
      label: newNodeLabel,
      type: newNodeType,
      properties: {},
      x: dimensions.width / 2 + (Math.random() - 0.5) * 50,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 50
    };
    setGraphData(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setNewNodeLabel('');
    showNotification("节点已添加", 'success');
  };

  const handleAddLink = () => {
    if (!newLinkSource || !newLinkTarget) {
      showNotification("请选择起始和目标节点", 'error');
      return;
    }
    if (newLinkSource === newLinkTarget) {
      showNotification("不能连接自身", 'error');
      return;
    }
    if (!newLinkLabel.trim()) {
      showNotification("请输入关系描述", 'error');
      return;
    }
    const newLink = { source: newLinkSource, target: newLinkTarget, label: newLinkLabel };
    setGraphData(prev => ({ ...prev, links: [...prev.links, newLink] }));
    setNewLinkLabel('');
    showNotification("关系已添加", 'success');
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraphData(prev => {
      const newNodes = prev.nodes.filter(n => n.id !== nodeId);
      const newLinks = prev.links.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
        const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
        return sourceId !== nodeId && targetId !== nodeId;
      });
      return { nodes: newNodes, links: newLinks };
    });
    setSelectedNode(null);
    showNotification("节点已删除", 'success');
  };

  const handleUpdateNode = (updatedNode: GraphNode) => {
    setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === updatedNode.id ? { ...n, ...updatedNode } : n)
    }));
    // Update local selection to reflect changes immediately
    setSelectedNode(updatedNode);
    showNotification("节点信息已更新", 'success');
  };

  const handleClearGraph = () => {
    if (window.confirm("确定要清空画布吗？")) {
      setGraphData({ nodes: [], links: [] });
      setSelectedNode(null);
    }
  };

  const handleSaveLocal = () => {
    localStorage.setItem('gas_pe_graph_data', JSON.stringify(graphData));
    showNotification("图谱已保存至本地缓存", 'success');
  };

  const handleLoadLocal = () => {
    const saved = localStorage.getItem('gas_pe_graph_data');
    if (saved) {
      setGraphData(JSON.parse(saved));
      showNotification("已加载本地图谱数据", 'success');
    }
  };

  const exportJSON = () => {
    const exportData = {
       ...graphData,
       links: graphData.links.map(l => ({
         source: typeof l.source === 'string' ? l.source : (l.source as GraphNode).id,
         target: typeof l.target === 'string' ? l.target : (l.target as GraphNode).id,
         label: l.label
       }))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gas_pipeline_graph.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportTriples = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newNodesMap = new Map<string, GraphNode>();
      const newLinks: any[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Try to split by tab, comma, or space
        let parts = trimmed.split('\t');
        if (parts.length < 3) parts = trimmed.split(',');
        if (parts.length < 3) parts = trimmed.split(/\s+/);

        if (parts.length >= 3) {
          const subject = parts[0].trim();
          const predicate = parts[1].trim();
          const object = parts[2].trim();

          if (!subject || !predicate || !object) return;

          if (!newNodesMap.has(subject)) {
            newNodesMap.set(subject, {
              id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              label: subject,
              type: inferNodeType(subject),
              x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
              y: dimensions.height / 2 + (Math.random() - 0.5) * 200
            });
          }
          if (!newNodesMap.has(object)) {
            newNodesMap.set(object, {
              id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              label: object,
              type: inferNodeType(object),
              x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
              y: dimensions.height / 2 + (Math.random() - 0.5) * 200
            });
          }

          const sourceNode = newNodesMap.get(subject)!;
          const targetNode = newNodesMap.get(object)!;

          newLinks.push({
            source: sourceNode.id,
            target: targetNode.id,
            label: predicate
          });
        }
      });

      if (newNodesMap.size > 0) {
        setGraphData({
          nodes: Array.from(newNodesMap.values()),
          links: newLinks
        });
        setSelectedNode(null);
        showNotification(`成功导入 ${newNodesMap.size} 个节点和 ${newLinks.length} 条关系`, 'success');
      } else {
        showNotification('未找到有效的三元组数据，请确保格式为 "主语 谓语 宾语"', 'error');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* Navigation Rail */}
      <div className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20">
         <button 
          onClick={() => setView('graph')}
          className={`p-3 rounded-xl transition-all ${view === 'graph' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          title="知识图谱"
         >
           <Network size={24} />
         </button>
         <button 
          onClick={() => setView('risk')}
          className={`p-3 rounded-xl transition-all ${view === 'risk' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          title="风险评价"
         >
           <ShieldAlert size={24} />
         </button>
      </div>

      {/* Sidebar for Graph View */}
      {view === 'graph' && (
        <div 
          className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden relative z-10`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <h1 className="font-bold text-lg text-slate-100 whitespace-nowrap">PE管道管理系统</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            {/* Template Selection */}
            <div className="space-y-3">
               <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><LayoutTemplate size={14} /> 模组选择</h2>
               <div className="flex gap-2">
                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded px-3 py-2 text-slate-200">
                  <option value="demo">默认演示数据</option>
                  <option value="station_leak">场站泄漏场景</option>
                  <option value="empty">空白画布</option>
                </select>
                <button onClick={handleLoadTemplate} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm transition-colors">加载</button>
              </div>
            </div>

            {/* Manual Edit - Always Visible */}
            <div className="space-y-3 animate-in fade-in duration-300">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><MousePointer2 size={14} /> 手动编辑</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                 <div className="flex border-b border-slate-800">
                   <button onClick={() => setActiveTab('node')} className={`flex-1 py-2 text-sm ${activeTab === 'node' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}>节点</button>
                   <button onClick={() => setActiveTab('link')} className={`flex-1 py-2 text-sm ${activeTab === 'link' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}>关系</button>
                 </div>
                 <div className="p-4 space-y-3">
                   {activeTab === 'node' ? (
                     <>
                       <input type="text" value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} placeholder="名称" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 placeholder-slate-500" />
                       <select value={newNodeType} onChange={(e) => setNewNodeType(e.target.value as NodeType)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200">
                         {Object.entries(NODE_LABELS_ZH).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                       </select>
                       <button onClick={handleAddNode} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm transition-colors">添加节点</button>
                     </>
                   ) : (
                     <>
                       <select value={newLinkSource} onChange={(e) => setNewLinkSource(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200"><option value="">起点</option>{graphData.nodes.map(n => (<option key={n.id} value={n.id}>{n.label}</option>))}</select>
                       <select value={newLinkTarget} onChange={(e) => setNewLinkTarget(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200"><option value="">终点</option>{graphData.nodes.map(n => (<option key={n.id} value={n.id}>{n.label}</option>))}</select>
                       <input type="text" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} placeholder="关系描述" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 placeholder-slate-500" />
                       <button onClick={handleAddLink} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm transition-colors">添加关系</button>
                     </>
                   )}
                 </div>
              </div>
            </div>

            {/* Node Detail - Visible below Manual Edit when selected */}
            {selectedNode && (
               <div className="border-t border-slate-800 pt-4 mt-2 animate-in slide-in-from-left-2 duration-300">
                  <NodeDetailPanel 
                      node={selectedNode} 
                      onClose={() => setSelectedNode(null)} 
                      onUpdate={handleUpdateNode}
                      onDelete={handleDeleteNode}
                  />
               </div>
            )}

          </div>
          
          <div className="p-4 border-t border-slate-800 grid grid-cols-4 gap-2">
             <button onClick={handleSaveLocal} className="p-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded text-xs text-slate-300"><Save size={16} className="mb-1 mx-auto" /> 保存</button>
             <button onClick={handleLoadLocal} className="p-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded text-xs text-slate-300"><Database size={16} className="mb-1 mx-auto" /> 读取</button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded text-xs text-slate-300"><Upload size={16} className="mb-1 mx-auto" /> 导入</button>
             <button onClick={exportJSON} className="p-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded text-xs text-slate-300"><FileJson size={16} className="mb-1 mx-auto" /> 导出</button>
             <input type="file" accept=".txt,.csv" ref={fileInputRef} onChange={handleImportTriples} className="hidden" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {view === 'graph' ? (
          <>
            <div className="h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400 transition-colors"><Settings size={20} /></button>
                <span className="text-sm font-semibold text-slate-300">燃气PE管道知识图谱交互系统</span>
              </div>
              <button onClick={handleClearGraph} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm border border-red-500/20 flex items-center gap-2 transition-colors"><Trash2 size={14} /> 清空画布</button>
            </div>
            <div ref={containerRef} className="flex-1 bg-black relative">
               <GraphCanvas data={graphData} width={dimensions.width} height={dimensions.height} onNodeClick={setSelectedNode} />
            </div>
          </>
        ) : (
          <RiskModule />
        )}

        {notification && (
          <div className={`absolute top-20 right-8 px-4 py-3 rounded shadow-lg border z-50 animate-fade-in-down ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' : 'bg-red-900/90 border-red-700 text-red-100'}`}>
             {notification.msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
