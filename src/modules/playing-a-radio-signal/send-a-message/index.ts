import { registerModule } from '@/registry';
import { SendMessageModule } from './SendMessageModule';
import { SendMessageExplanation } from './SendMessageExplanation';

registerModule({
  id: 'send-a-message',
  title: 'Send a Message',
  track: 'playing-a-radio-signal',
  layer: 2,
  order: 7,
  isCapstone: true,
  oneLineIntuition:
    'The whole chain end to end: type text, watch it ride symbols across a noisy channel and come back (mostly) intact.',
  component: SendMessageModule,
  explanation: SendMessageExplanation,
  status: 'stable',
});
