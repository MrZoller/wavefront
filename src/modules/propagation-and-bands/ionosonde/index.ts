import { registerModule } from '@/registry';
import { IonosondeModule } from './IonosondeModule';
import { IonosondeExplanation } from './IonosondeExplanation';

registerModule({
  id: 'ionosonde',
  title: 'The Ionosonde & the Ionogram',
  track: 'propagation-and-bands',
  layer: 1,
  order: 3,
  oneLineIntuition:
    'Ping the ionosphere and sweep frequency — the echo delay is a height, and where the echo vanishes is the critical frequency.',
  component: IonosondeModule,
  explanation: IonosondeExplanation,
  status: 'stable',
});
