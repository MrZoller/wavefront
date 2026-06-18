import { registerModule } from '@/registry';
import { BandExplorerModule } from './BandExplorerModule';
import { BandExplorerExplanation } from './BandExplorerExplanation';

registerModule({
  id: 'band-explorer',
  title: 'Band Explorer',
  track: 'propagation-and-bands',
  layer: 0,
  order: 0,
  oneLineIntuition:
    'Drag frequency across the bands and watch wavelength, propagation mode, and reach change live.',
  component: BandExplorerModule,
  explanation: BandExplorerExplanation,
  status: 'stable',
  isCapstone: true,
});
