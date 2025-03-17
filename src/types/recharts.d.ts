declare module 'recharts' {
  import React from 'react';
  
  // 圖表組件
  export const BarChart: React.FC<any>;
  export const LineChart: React.FC<any>;
  export const PieChart: React.FC<any>;
  export const AreaChart: React.FC<any>;
  export const ScatterChart: React.FC<any>;
  export const RadarChart: React.FC<any>;
  
  // 圖表元素
  export const Bar: React.FC<any>;
  export const Line: React.FC<any>;
  export const Area: React.FC<any>;
  export const Pie: React.FC<any>;
  export const Scatter: React.FC<any>;
  export const Radar: React.FC<any>;
  
  // 工具和輔助組件
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const Legend: React.FC<any>;
  export const ResponsiveContainer: React.FC<any>;
  export const Cell: React.FC<any>;
  export const LabelList: React.FC<any>;
  export const Label: React.FC<any>;
  export const ReferenceArea: React.FC<any>;
  export const ReferenceLine: React.FC<any>;
  export const ReferenceDot: React.FC<any>;
} 