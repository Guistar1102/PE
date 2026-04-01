
import React, { useState, useEffect } from 'react';
import { GraphNode, NodeType } from '../types';
import { NODE_LABELS_ZH, NODE_COLORS } from '../constants';
import { 
  X, 
  Trash2, 
  Save, 
  Palette, 
  Type, 
  List,
  Plus,
  MinusCircle,
  Settings2
} from 'lucide-react';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  onUpdate: (updatedNode: GraphNode) => void;
  onDelete: (nodeId: string) => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const [editedNode, setEditedNode] = useState<GraphNode | null>(null);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'style'>('info');

  useEffect(() => {
    setEditedNode(node);
  }, [node]);

  if (!node || !editedNode) {
    return null;
  }

  const handleSave = () => {
    if (editedNode) {
      onUpdate(editedNode);
    }
  };

  const handleColorChange = (color: string) => {
    setEditedNode(prev => prev ? { ...prev, color } : null);
  };

  const handlePropChange = (key: string, value: string) => {
    setEditedNode(prev => {
        if(!prev) return null;
        return {
            ...prev,
            properties: {
                ...prev.properties,
                [key]: value
            }
        };
    });
  };

  const addProperty = () => {
    if (newPropKey && newPropValue) {
        handlePropChange(newPropKey, newPropValue);
        setNewPropKey('');
        setNewPropValue('');
    }
  };

  const removeProperty = (key: string) => {
      setEditedNode(prev => {
          if(!prev) return null;
          const newProps = { ...prev.properties };
          delete newProps[key];
          return { ...prev, properties: newProps };
      });
  };

  const currentColor = editedNode.color || NODE_COLORS[editedNode.type] || NODE_COLORS.UNKNOWN;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-sm animate-in fade-in duration-300">
      
      {/* Header with Close for deselection */}
      <div className="h-10 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-blue-400"/>
          <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">节点详情编辑</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors" title="关闭详情">
            <X size={14} />
        </button>
      </div>

      {/* Node Identity Banner */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] flex-shrink-0" style={{ color: currentColor, backgroundColor: currentColor }} />
            <span className="text-sm font-bold text-slate-100 truncate" title={editedNode.label}>{editedNode.label}</span>
         </div>
         <button onClick={() => onDelete(node.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="删除节点">
             <Trash2 size={14} />
         </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${activeTab === 'info' ? 'text-blue-400 bg-slate-800' : 'text-slate-500 hover:bg-slate-800/50'}`}
        >
          <List size={12} /> 属性
        </button>
        <button 
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${activeTab === 'style' ? 'text-blue-400 bg-slate-800' : 'text-slate-500 hover:bg-slate-800/50'}`}
        >
          <Palette size={12} /> 样式
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-4">
        
        {activeTab === 'info' && (
          <>
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">基本信息</label>
              <div className="bg-slate-950/50 rounded p-2 border border-slate-800 space-y-1.5">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">ID</span>
                    <span className="font-mono text-slate-400 truncate max-w-[120px]" title={editedNode.id}>{editedNode.id}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">类型</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs">{NODE_LABELS_ZH[editedNode.type]}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">坐标</span>
                    <span className="font-mono text-slate-400 text-xs">
                      {Math.round(editedNode.x || 0)}, {Math.round(editedNode.y || 0)}
                    </span>
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-bold tracking-wider flex justify-between items-center">
                <span>业务属性</span>
              </label>
              
              <div className="space-y-1.5">
                {Object.entries(editedNode.properties || {}).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-sm group">
                     <div className="w-1/3 text-slate-500 truncate text-xs" title={key}>{key}</div>
                     <input 
                       type="text" 
                       value={val} 
                       onChange={(e) => handlePropChange(key, e.target.value)}
                       className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:border-blue-500 outline-none text-xs"
                     />
                     <button onClick={() => removeProperty(key)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                       <MinusCircle size={12} />
                     </button>
                  </div>
                ))}
                
                {/* Add Property Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50 mt-1">
                   <input 
                     placeholder="键"
                     value={newPropKey}
                     onChange={e => setNewPropKey(e.target.value)}
                     className="w-1/3 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                   />
                   <input 
                     placeholder="值"
                     value={newPropValue}
                     onChange={e => setNewPropValue(e.target.value)}
                     className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                   />
                   <button onClick={addProperty} className="text-slate-400 hover:text-blue-400">
                     <Plus size={14} />
                   </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">节点名称</label>
               <div className="flex items-center gap-2">
                 <Type size={14} className="text-slate-500" />
                 <input 
                    type="text" 
                    value={editedNode.label} 
                    onChange={(e) => setEditedNode({...editedNode, label: e.target.value})}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 outline-none"
                 />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">节点颜色</label>
               <div className="flex gap-2 flex-wrap">
                  {Object.values(NODE_COLORS).map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-5 h-5 rounded-full border border-slate-700 transition-transform hover:scale-110 ${currentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative">
                    <input 
                      type="color" 
                      value={currentColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-5 h-5 p-0 border-0 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0"
                    />
                     <div className="w-5 h-5 rounded-full border border-slate-700 bg-[conic-gradient(from_180deg_at_50%_50%,#F00_0deg,#FF0_60deg,#0F0_120deg,#0FF_180deg,#00F_240deg,#F0F_300deg,#F00_360deg)] flex items-center justify-center">
                        <Plus size={10} className="text-black/50" />
                     </div>
                  </div>
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">类型分类</label>
               <select 
                 value={editedNode.type}
                 onChange={(e) => setEditedNode({...editedNode, type: e.target.value as NodeType})}
                 className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-slate-300 focus:border-blue-500 outline-none"
               >
                 {Object.entries(NODE_LABELS_ZH).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                 ))}
               </select>
             </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
         <button 
           onClick={handleSave} 
           className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
         >
           <Save size={14} /> 保存更改
         </button>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
