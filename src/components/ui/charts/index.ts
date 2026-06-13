// components/ui/charts/index.ts
// Barrel export so consumers can do:
//   import { AreaChart, FunnelBar, RadarChart, DonutChart } from '@/components/ui/charts';

export { default as AreaChart }   from './AreaChart';
export { default as FunnelBar }   from './FunnelBar';
export { default as RadarChart }  from './RadarChart';
export { default as DonutChart }  from './DonutChart';

export type { AreaChartPoint, AreaChartProps }   from './AreaChart';
export type { FunnelBarProps }                   from './FunnelBar';
export type { RadarSkill, RadarSkillSingle, RadarSkillDual, RadarChartProps } from './RadarChart';
export type { DonutSegment, DonutChartProps }    from './DonutChart';
