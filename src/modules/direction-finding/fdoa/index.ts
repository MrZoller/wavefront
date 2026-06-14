import { registerModule } from '@/registry';
import { FdoaModule } from './FdoaModule';
import { FdoaExplanation } from './FdoaExplanation';

registerModule({
  id: 'fdoa',
  title: 'FDOA (Doppler Difference)',
  track: 'direction-finding',
  layer: 2,
  order: 8,
  oneLineIntuition:
    'Two moving platforms see the carrier Doppler-shifted differently; a constant difference is an isodoppler curve through the emitter.',
  component: FdoaModule,
  explanation: FdoaExplanation,
  // Advanced/optional offshoot: a Doppler-difference variant, not a rung you pass through to reach
  // the GDOP capstone — the tag is what places it outside Geolocation's core climb.
  status: 'advanced',
});
