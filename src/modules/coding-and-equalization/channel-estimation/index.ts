import { registerModule } from '@/registry';
import { ChannelEstimationModule } from './ChannelEstimationModule';
import { ChannelEstimationExplanation } from './ChannelEstimationExplanation';

registerModule({
  id: 'channel-estimation',
  title: 'Channel Estimation',
  track: 'coding-and-equalization',
  layer: 1,
  order: 2,
  oneLineIntuition:
    'Send known pilot symbols, compare what comes back, and the channel response falls out — the thing the equalizer undoes.',
  component: ChannelEstimationModule,
  explanation: ChannelEstimationExplanation,
});
