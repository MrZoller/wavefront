import { registerModule } from '@/registry';
import { RadioHorizonModule } from './RadioHorizonModule';
import { RadioHorizonExplanation } from './RadioHorizonExplanation';

registerModule({
  id: 'radio-horizon',
  title: 'Radio Horizon / Line-of-Sight',
  track: 'propagation-and-bands',
  layer: 0,
  order: 1,
  oneLineIntuition: 'Drag two antenna heights and watch the line-of-sight horizon stretch.',
  component: RadioHorizonModule,
  explanation: RadioHorizonExplanation,
  status: 'stable',
});
