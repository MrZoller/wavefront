import { registerModule } from '@/registry';
import { ChannelizerModule } from './ChannelizerModule';
import { ChannelizerExplanation } from './ChannelizerExplanation';

registerModule({
  id: 'channelizer',
  title: 'Channelizer (PFB)',
  track: 'fundamentals',
  layer: 2,
  order: 5,
  isCapstone: true,
  oneLineIntuition:
    'Tile a wide band into channels and pull one out — the FFT is a leaky filter bank; a polyphase prototype makes it sharp.',
  component: ChannelizerModule,
  explanation: ChannelizerExplanation,
  status: 'stable',
});
