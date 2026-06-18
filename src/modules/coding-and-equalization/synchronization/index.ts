import { registerModule } from '@/registry';
import { SynchronizationModule } from './SynchronizationModule';
import { SynchronizationExplanation } from './SynchronizationExplanation';

registerModule({
  id: 'synchronization',
  title: 'Synchronization',
  track: 'coding-and-equalization',
  layer: 1,
  order: 4,
  oneLineIntuition:
    'Carrier and timing recovery are tracking loops: measure the error, smooth it, feed a correction back until it locks.',
  component: SynchronizationModule,
  explanation: SynchronizationExplanation,
  status: 'stub',
});
