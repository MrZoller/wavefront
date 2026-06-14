import { registerModule } from '@/registry';
import { MultipathModule } from './MultipathModule';
import { MultipathExplanation } from './MultipathExplanation';

registerModule({
  id: 'multipath-fading',
  title: 'Multipath & Fading',
  track: 'playing-a-radio-signal',
  layer: 1,
  order: 4,
  oneLineIntuition:
    'A direct ray plus a delayed echo notches the channel and smears symbols together — frequency-selective fading and ISI.',
  component: MultipathModule,
  explanation: MultipathExplanation,
  status: 'stable',
});
