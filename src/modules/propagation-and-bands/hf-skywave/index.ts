import { registerModule } from '@/registry';
import { SkywaveModule } from './SkywaveModule';
import { SkywaveExplanation } from './SkywaveExplanation';

registerModule({
  id: 'hf-skywave',
  title: 'HF Skywave & the Ionosphere',
  track: 'propagation-and-bands',
  layer: 0,
  order: 2,
  oneLineIntuition:
    'An HF ray bounces off the ionosphere — or punches through, set by day/night and frequency.',
  component: SkywaveModule,
  explanation: SkywaveExplanation,
  status: 'stub',
});
