import { registerModule } from '@/registry';
import { TdoaModule } from './TdoaModule';
import { TdoaExplanation } from './TdoaExplanation';

registerModule({
  id: 'tdoa-multilateration',
  title: 'TDOA Multilateration',
  track: 'direction-finding',
  oneLineIntuition:
    'Each receiver pair is a hyperbola of constant range difference; a 4th receiver resolves which intersection is the emitter.',
  component: TdoaModule,
  explanation: TdoaExplanation,
  status: 'stable',
});
