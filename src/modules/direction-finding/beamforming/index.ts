import { registerModule } from '@/registry';
import { BeamformingModule } from './BeamformingModule';
import { BeamformingExplanation } from './BeamformingExplanation';

registerModule({
  id: 'beamforming',
  title: 'Beamforming / Array Pattern',
  track: 'direction-finding',
  oneLineIntuition: 'Phase-combine an array of antennas to steer a beam — and watch it sweep.',
  component: BeamformingModule,
  explanation: BeamformingExplanation,
  status: 'stable',
});
