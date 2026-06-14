import { registerModule } from '@/registry';
import { GdopModule } from './GdopModule';
import { GdopExplanation } from './GdopExplanation';

registerModule({
  id: 'gdop-heatmap',
  title: 'GDOP Heatmap',
  track: 'direction-finding',
  layer: 2,
  order: 7,
  isCapstone: true,
  oneLineIntuition: 'Geometry turns measurement error into position error — see it across the map.',
  component: GdopModule,
  explanation: GdopExplanation,
  status: 'stable',
});
