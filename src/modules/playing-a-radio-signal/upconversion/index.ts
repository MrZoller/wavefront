import { registerModule } from '@/registry';
import { UpconversionModule } from './UpconversionModule';
import { UpconversionExplanation } from './UpconversionExplanation';

registerModule({
  id: 'upconversion',
  title: 'Up/Downconversion',
  track: 'playing-a-radio-signal',
  layer: 0,
  order: 2,
  oneLineIntuition:
    'Mix baseband I/Q onto a real carrier (I·cos − Q·sin) and back down — the spectrum slides, the bits don’t.',
  component: UpconversionModule,
  explanation: UpconversionExplanation,
  status: 'stable',
});
