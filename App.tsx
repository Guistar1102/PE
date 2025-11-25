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
  MousePointer2
} from 'lucide-react';
import GraphCanvas from './components/GraphCanvas';
import { GraphData, GraphNode, NodeType } from './types';
import { INITIAL_DATA, NODE_LABELS_ZH, NODE_COLORS, GRAPH_TEMPLATES } from './constants';

const App: React.FC = () => {
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
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
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Graph Management Functions ---

  const handleLoadTemplate = () => {
    const template = GRAPH_TEMPLATES[selectedTemplate];
    if (template) {
      // Deep copy to avoid mutating the template const
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

    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    
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

    // Check if link already exists
    const exists = graphData.links.some(l => 
      (typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) === newLinkSource &&
      (typeof l.target === 'string' ? l.target : (l.target as GraphNode).id) === newLinkTarget
    );

    if (exists) {
      showNotification("关系已存在", 'error');
      return;
    }

    const newLink = {
      source: newLinkSource,
      target: newLinkTarget,
      label: newLinkLabel
    };

    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }));

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

  const handleClearGraph = () => {
    if (window.confirm("确定要清空画布吗？未保存的数据将丢失。")) {
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
      try {
        setGraphData(JSON.parse(saved));
        showNotification("已加载本地图谱数据", 'success');
      } catch (e) {
        showNotification("加载数据损坏", 'error');
      }
    } else {
      showNotification("本地无存档", 'error');
    }
  };

  const exportJSON = () => {
    const exportData = {
       ...graphData,
       // Normalize links to ensure they export as IDs not circular references
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

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden relative z-10`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Network className="text-blue-500" />
          <h1 className="font-bold text-lg text-slate-100 whitespace-nowrap">PE管道图谱系统</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Module Selection */}
          <div className="space-y-3">
             <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutTemplate size={14} /> 模组/场景选择
            </h2>
            <div className="flex gap-2">
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="demo">默认演示数据</option>
                <option value="station_leak">场站泄漏应急场景</option>
                <option value="complex_network">复杂管网连接场景</option>
                <option value="empty">空白画布</option>
              </select>
              <button 
                onClick={handleLoadTemplate}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                加载
              </button>
            </div>
          </div>

          {/* Manual Editor */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MousePointer2 size={14} /> 手动编辑
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
               <div className="flex border-b border-slate-800">
                 <button 
                    onClick={() => setActiveTab('node')}
                    className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 ${activeTab === 'node' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <PlusCircle size={14} /> 添加节点
                 </button>
                 <button 
                    onClick={() => setActiveTab('link')}
                    className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 ${activeTab === 'link' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <Link2 size={14} /> 添加关系
                 </button>
               </div>
               
               <div className="p-4 space-y-3">
                 {activeTab === 'node' ? (
                   <>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">节点名称</label>
                       <input 
                         type="text" 
                         value={newNodeLabel}
                         onChange={(e) => setNewNodeLabel(e.target.value)}
                         placeholder="例如：主干管01"
                         className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">节点类型</label>
                       <select 
                         value={newNodeType}
                         onChange={(e) => setNewNodeType(e.target.value as NodeType)}
                         className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                       >
                         {Object.entries(NODE_LABELS_ZH).map(([key, label]) => (
                           <option key={key} value={key}>{label}</option>
                         ))}
                       </select>
                     </div>
                     <button 
                       onClick={handleAddNode}
                       className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm mt-2 transition-colors"
                     >
                       添加节点
                     </button>
                   </>
                 ) : (
                   <>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">起始节点</label>
                       <select 
                         value={newLinkSource}
                         onChange={(e) => setNewLinkSource(e.target.value)}
                         className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                       >
                         <option value="">-- 选择起点 --</option>
                         {graphData.nodes.map(n => (
                           <option key={n.id} value={n.id}>{n.label} ({NODE_LABELS_ZH[n.type]})</option>
                         ))}
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">目标节点</label>
                       <select 
                         value={newLinkTarget}
                         onChange={(e) => setNewLinkTarget(e.target.value)}
                         className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                       >
                         <option value="">-- 选择终点 --</option>
                         {graphData.nodes.map(n => (
                           <option key={n.id} value={n.id}>{n.label} ({NODE_LABELS_ZH[n.type]})</option>
                         ))}
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-slate-500 block mb-1">关系描述</label>
                       <input 
                         type="text" 
                         value={newLinkLabel}
                         onChange={(e) => setNewLinkLabel(e.target.value)}
                         placeholder="例如：连接、包含、流向"
                         className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                       />
                     </div>
                     <button 
                       onClick={handleAddLink}
                       className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm mt-2 transition-colors"
                     >
                       添加关系
                     </button>
                   </>
                 )}
               </div>
            </div>
          </div>

          {/* Node Info Panel */}
          <div className="space-y-3">
             <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Search size={14} /> 选中节点详情
            </h2>
            {selectedNode ? (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 relative group">
                <button 
                   onClick={() => handleDeleteNode(selectedNode.id)}
                   className="absolute top-2 right-2 text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   title="删除节点"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
                  />
                  <span className="font-bold text-lg">{selectedNode.label}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2 font-mono break-all">{selectedNode.id}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-700/50 pb-1">
                    <span className="text-slate-400">类型:</span>
                    <span className="text-slate-200">{NODE_LABELS_ZH[selectedNode.type]}</span>
                  </div>
                  {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 ? (
                     Object.entries(selectedNode.properties).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-slate-700/50 pb-1 last:border-0">
                        <span className="text-slate-400 capitalize">{key}:</span>
                        <span className="text-slate-200 text-right">{String(val)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 py-1">暂无额外属性</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic text-center py-4 bg-slate-900 rounded border border-slate-800 border-dashed">
                点击画布中的节点查看详情
              </div>
            )}
          </div>

           {/* Legend */}
           <div className="space-y-3">
             <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">图例</h2>
             <div className="grid grid-cols-2 gap-2">
                {Object.entries(NODE_LABELS_ZH).map(([type, label]) => (
                  <div key={type} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type as NodeType] }}></span>
                    {label}
                  </div>
                ))}
             </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 grid grid-cols-3 gap-2">
           <button onClick={handleSaveLocal} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex justify-center items-center gap-1 text-xs" title="保存到本地">
             <Save size={16} /> 保存
           </button>
           <button onClick={handleLoadLocal} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex justify-center items-center gap-1 text-xs" title="加载本地存档">
             <Database size={16} /> 读取
           </button>
           <button onClick={exportJSON} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex justify-center items-center gap-1 text-xs" title="导出JSON">
             <FileJson size={16} /> 导出
           </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Toolbar */}
        <div className="h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
            {!sidebarOpen && <span className="text-sm font-semibold text-slate-300">PE管道图谱系统</span>}
          </div>

          <div className="flex items-center gap-4">
             <div className="text-sm text-slate-400 hidden md:block">
               节点: <span className="text-slate-100 font-mono">{graphData.nodes.length}</span> | 
               关系: <span className="text-slate-100 font-mono">{graphData.links.length}</span>
             </div>
             <div className="h-4 w-px bg-slate-700 hidden md:block"></div>
             <button 
                onClick={handleClearGraph}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm transition-colors border border-red-500/20"
             >
               <Trash2 size={14} /> 清空
             </button>
          </div>
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="flex-1 bg-black relative">
           <GraphCanvas 
             data={graphData} 
             width={dimensions.width}
             height={dimensions.height}
             onNodeClick={setSelectedNode}
           />
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`absolute top-20 right-8 px-4 py-3 rounded shadow-lg border z-50 animate-fade-in-down ${
            notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' : 'bg-red-900/90 border-red-700 text-red-100'
          }`}>
             {notification.msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
