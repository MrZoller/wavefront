import { registerModule } from '@/registry';
import { EqualizationModule } from './EqualizationModule';
import { EqualizationExplanation } from './EqualizationExplanation';

registerModule({
  id: 'equalization',
  title: 'Equalization',
  track: 'coding-and-equalization',
  layer: 1,
  order: 3,
  oneLineIntuition:
    'Multipath smears the constellation and shuts the eye; the equalizer inverts the channel and it all snaps back.',
  component: EqualizationModule,
  explanation: EqualizationExplanation,
  isCapstone: true,
});
