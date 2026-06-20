import { registerModule } from '@/registry';
import { GpsAcquisitionModule } from './GpsAcquisitionModule';
import { GpsAcquisitionExplanation } from './GpsAcquisitionExplanation';

registerModule({
  id: 'gps-acquisition',
  title: 'GPS Acquisition',
  track: 'modulations-and-waveforms',
  layer: 2,
  order: 7,
  oneLineIntuition:
    'The signal is too weak to see — it sits under the noise. Correlate against the code you already know and a peak rises out; where it peaks is a distance.',
  component: GpsAcquisitionModule,
  explanation: GpsAcquisitionExplanation,
  status: 'advanced',
});
