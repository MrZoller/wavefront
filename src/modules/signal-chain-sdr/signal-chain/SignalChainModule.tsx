import { BlockDiagram, type DiagramEdge, type DiagramNode } from '@/components/BlockDiagram';
import { GlossedText } from '@/components/GlossedText';
import { PlotTitle } from '@/components/plots/PlotTitle';

// One row of evenly-spaced blocks; the viewBox holds 8 so receive and transmit share a block size.
const X0 = 12;
const PITCH = 138;
const BW = 120;
const VIEW_W = X0 + 7 * PITCH + BW + X0;
const VIEW_H = 80;
const xAt = (i: number) => X0 + i * PITCH;
const row = (defs: Omit<DiagramNode, 'x' | 'y' | 'w'>[]): DiagramNode[] =>
  defs.map((d, i) => ({ ...d, x: xAt(i), y: 13, w: BW }));
const chain = (nodes: DiagramNode[]): DiagramEdge[] =>
  nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id }));

// Receive: antenna → low-noise amp → RF filter → mixer (tune) → AGC → ADC → channelizer → demod.
// LNA has no software counterpart (amplifier internals are out of scope) — it stays a quiet block.
const RX = row([
  { id: 'ant-rx', label: 'Antenna', sub: 'receive side', moduleId: 'phase-difference' },
  { id: 'lna', label: 'LNA', sub: 'amplify' },
  { id: 'rf-filter', label: 'RF filter', sub: 'FIR filter', moduleId: 'fir-filter' },
  { id: 'mixer', label: 'Mixer', sub: 'downconvert', moduleId: 'upconversion' },
  { id: 'agc', label: 'AGC', sub: 'gain & clip', moduleId: 'gain-agc' },
  { id: 'adc', label: 'ADC', sub: 'quantize', moduleId: 'quantization' },
  { id: 'chan', label: 'Channelizer', sub: 'split band', moduleId: 'channelizer' },
  { id: 'demod', label: 'Demod', sub: 'recover bits', moduleId: 'send-a-message' },
]);

// Transmit mirror: modulator → DAC → up-converter → power amp → filter → antenna.
const TX = row([
  { id: 'mod', label: 'Modulator', sub: 'bits → symbols', moduleId: 'symbol-mapping' },
  { id: 'dac', label: 'DAC', sub: 'samples → wave', moduleId: 'quantization' },
  { id: 'upconv', label: 'Up-converter', sub: 'to RF', moduleId: 'upconversion' },
  { id: 'pa', label: 'PA', sub: 'power amp' },
  { id: 'tx-filter', label: 'Filter', sub: 'FIR filter', moduleId: 'fir-filter' },
  { id: 'ant-tx', label: 'Antenna', sub: 'transmit', moduleId: 'phase-difference' },
]);

/**
 * Receiver signal chain (Track F capstone). The whole point of the track: every box in a real radio
 * maps to math you can poke at. Two clickable block diagrams — the receive chain and its transmit
 * mirror — route each block to the module that simulates its function.
 *
 * Built on the reusable {@link BlockDiagram}, which could later double as an app-wide orientation
 * map (behind a flag) — kept generic here rather than promoted.
 */
export function SignalChainModule() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <PlotTitle>
          Receive chain <span className="text-text-faint">— antenna to bits</span>
        </PlotTitle>
        <BlockDiagram
          nodes={RX}
          edges={chain(RX)}
          width={VIEW_W}
          height={VIEW_H}
          ariaLabel="Receive signal chain: antenna, LNA, RF filter, mixer, AGC, ADC, channelizer, demodulator"
        />
      </div>

      <div>
        <PlotTitle>
          Transmit chain <span className="text-text-faint">— bits to antenna (the mirror)</span>
        </PlotTitle>
        <BlockDiagram
          nodes={TX}
          edges={chain(TX)}
          width={VIEW_W}
          height={VIEW_H}
          ariaLabel="Transmit signal chain: modulator, DAC, up-converter, power amplifier, filter, antenna"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            click any lit block to open the module that simulates it — the mixer is downconversion,
            the ADC is quantization, the filters are FIR taps, the channelizer splits the band · the
            grey blocks (LNA, PA) are analog-only, out of scope here · every box is math you can
            poke at
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
