import { registerModule } from '@/registry';
import { ConvolutionModule } from './ConvolutionModule';
import { ConvolutionExplanation } from './ConvolutionExplanation';

registerModule({
  id: 'convolution',
  title: 'Convolution & the Impulse Response',
  track: 'fundamentals',
  // Its own "Systems" stage, before the filtering layer: FIR filtering, the matched filter, and
  // multipath are all instances of this one operation, so it reads as the general idea under them.
  layer: 1,
  order: 4,
  oneLineIntuition:
    'A system is completely described by how it answers a single impulse; its output for any signal is a sum of shifted, scaled copies of that impulse response — and that sum is convolution.',
  component: ConvolutionModule,
  explanation: ConvolutionExplanation,
  status: 'stable',
});
