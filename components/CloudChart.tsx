
import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { CloudParams } from '../types';
import { generateCloudDrops } from '../utils/cloudModel';

interface CloudChartProps {
  clouds: { params: CloudParams; label: string; color: string; visible?: boolean }[];
  width?: number | string;
  height?: number;
  domain?: [number, number];
  title?: string;
  showYAxis?: boolean;
}

const CloudChart: React.FC<CloudChartProps> = ({ 
  clouds, 
  width = "100%", 
  height = 300, 
  domain = [0, 100],
  title,
  showYAxis = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const margin = { top: 30, right: 30, bottom: 40, left: showYAxis ? 50 : 20 };
  
  // 保持与原 SVG 坐标系一致的参考宽度
  const containerWidth = 800; 
  const innerWidth = containerWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 坐标轴比例尺
  const xScale = d3.scaleLinear().domain(domain).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, 1.05]).range([innerHeight, 0]);

  // 计算云滴数据
  const chartData = useMemo(() => {
    return clouds.filter(c => c.visible !== false).map(c => ({
      ...c,
      drops: generateCloudDrops(c.params, 1000) // 每个云模型 1000 个点
    }));
  }, [clouds]);

  // 使用 Canvas 进行高性能绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 处理高分屏模糊问题 (Retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, containerWidth, height);
    
    // 移动画笔到边距区域
    ctx.translate(margin.left, margin.top);

    // 遍历绘制每个云图层
    chartData.forEach(cloud => {
      ctx.fillStyle = cloud.color;
      
      cloud.drops.forEach(d => {
        const x = xScale(d.x);
        const y = yScale(d.y);
        
        // 仅在绘图区域内绘制
        if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
          ctx.beginPath();
          // 根据隶属度(mu)调整透明度，复现“云”的朦胧感
          ctx.globalAlpha = d.y * 0.4; 
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }, [chartData, xScale, yScale, margin.left, margin.top, height]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50 shadow-2xl h-full flex flex-col relative overflow-hidden">
      {title && (
        <div className="flex justify-between items-center mb-2 px-2 relative z-10">
          <h3 className="text-slate-300 text-xs font-bold uppercase tracking-widest">{title}</h3>
          <div className="flex gap-2">
             {clouds.slice(0, 3).map((c, i) => (
               <div key={i} className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                 <span className="text-[10px] text-slate-500">{c.label}</span>
               </div>
             ))}
          </div>
        </div>
      )}
      
      <div className="flex-1 min-h-0 relative">
        {/* 底层：SVG 渲染网格和坐标轴 (文字需要矢量清晰) */}
        <svg 
          viewBox={`0 0 ${containerWidth} ${height}`} 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* 网格线 */}
            <g className="grid-lines" opacity={0.05}>
              {yScale.ticks(5).map(t => (
                <line key={t} x1={0} x2={innerWidth} y1={yScale(t)} y2={yScale(t)} stroke="white" strokeDasharray="2,2" />
              ))}
            </g>
            
            {/* X 轴 */}
            <g transform={`translate(0, ${innerHeight})`}>
              <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="#334155" strokeWidth={1} />
              {xScale.ticks(10).map(t => (
                <g key={t} transform={`translate(${xScale(t)}, 0)`}>
                  <line y1={0} y2={5} stroke="#475569" />
                  <text y={18} textAnchor="middle" fontSize="10" fill="#64748b" fontVariant="tabular-nums">{t}</text>
                </g>
              ))}
              <text x={innerWidth} y={35} textAnchor="end" fontSize="10" fill="#475569" fontWeight="bold">评价分值 / 风险值 (Ex)</text>
            </g>

            {/* Y 轴 */}
            {showYAxis && (
              <g>
                <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="#334155" strokeWidth={1} />
                {yScale.ticks(5).map(t => (
                  <g key={t} transform={`translate(0, ${yScale(t)})`}>
                    <line x1={0} x2={-5} stroke="#475569" />
                    <text x={-12} dy="0.32em" textAnchor="end" fontSize="10" fill="#64748b">{t.toFixed(1)}</text>
                  </g>
                ))}
              </g>
            )}
          </g>
        </svg>

        {/* 顶层：Canvas 渲染云滴 (极速绘制核心) */}
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%', display: 'block' }}
          className="relative z-10 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default React.memo(CloudChart);
