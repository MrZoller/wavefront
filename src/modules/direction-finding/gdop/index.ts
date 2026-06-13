import { registerModule } from '@/registry';
import { GdopModule } from './GdopModule';
import { GdopExplanation } from './GdopExplanation';

registerModule({
  id: 'gdop-heatmap',
  title: 'GDOP Heatmap',
  track: 'direction-finding',
  oneLineIntuition: 'Geometry turns measurement error into position error — see it across the map.',
  component: GdopModule,
  explanation: GdopExplanation,
  status: 'stable',
});
