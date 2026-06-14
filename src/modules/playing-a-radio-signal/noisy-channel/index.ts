import { registerModule } from '@/registry';
import { NoisyChannelModule } from './NoisyChannelModule';
import { NoisyChannelExplanation } from './NoisyChannelExplanation';

registerModule({
  id: 'noisy-channel',
  title: 'The Noisy Channel',
  track: 'playing-a-radio-signal',
  layer: 1,
  order: 3,
  oneLineIntuition:
    'AWGN smears each symbol into a cloud; slice to the nearest point and count the bits that flipped.',
  component: NoisyChannelModule,
  explanation: NoisyChannelExplanation,
  status: 'stable',
});
