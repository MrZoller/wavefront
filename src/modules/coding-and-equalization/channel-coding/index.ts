import { registerModule } from '@/registry';
import { ChannelCodingModule } from './ChannelCodingModule';
import { ChannelCodingExplanation } from './ChannelCodingExplanation';

registerModule({
  id: 'channel-coding',
  title: 'Channel Coding (FEC)',
  track: 'coding-and-equalization',
  layer: 0,
  order: 1,
  oneLineIntuition:
    'Add structured redundancy and the receiver can correct flipped bits — the coded BER curve shifts left.',
  component: ChannelCodingModule,
  explanation: ChannelCodingExplanation,
});
