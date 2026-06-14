import { registerModule } from '@/registry';
import { QuantizationModule } from './QuantizationModule';
import { QuantizationExplanation } from './QuantizationExplanation';

registerModule({
  id: 'quantization',
  title: 'Quantization & Bit Depth',
  track: 'signal-chain-sdr',
  layer: 0,
  order: 0,
  oneLineIntuition:
    'An ADC rounds each sample to one of 2^N levels — more bits means a lower noise floor and more dynamic range.',
  component: QuantizationModule,
  explanation: QuantizationExplanation,
  status: 'stable',
});
