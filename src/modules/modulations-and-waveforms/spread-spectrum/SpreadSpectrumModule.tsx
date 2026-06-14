import { useMemo, useState } from 'react';
import { GlossedText } from '@/components/GlossedText';
import { Slider } from '@/components/Slider';
import { AXIS } from '@/components/plots/axisLabel';
import { PlotTitle } from '@/components/plots/PlotTitle';
import { SpectrumPlot } from '@/components/plots/SpectrumPlot';
import { type Complex } from '@/dsp/complex';
import { dsssSpread, pnCode, processingGainDb } from '@/dsp/waveforms';
import { bipolarSequence } from '@/dsp/random';
import { magnitudeSpectrumLinear, toDb } from '@/dsp/spectrum';

const N_BITS = 32;

/**
 * Spread spectrum / DSSS (brief §6, focused stub). Multiply each data bit by a fast pseudo-noise
 * code and the spectrum smears out wide and low — buried near the noise floor. The receiver, knowing
 * the code, de-spreads it back to a tall narrow peak (processing gain), while interference smears.
 */
export function SpreadSpectrumModule() {
  const [factor, setFactor] = useState(16); // chips per bit (spreading factor L)

  const { narrow, spread } = useMemo(() => {
    const bits = bipolarSequence(N_BITS, 3).map((b) => (b > 0 ? 1 : 0));
    // Narrowband baseline: each bit held over L samples (occupies 1/L of the band).
    const held: Complex[] = [];
    for (const b of bits) for (let i = 0; i < factor; i++) held.push({ re: b ? 1 : -1, im: 0 });
    // Spread: each bit × the PN code → L chips per bit at the full sample rate.
    const chips = dsssSpread(bits, pnCode(factor, 7));
    const spreadSig: Complex[] = chips.map((c) => ({ re: c, im: 0 }));
    // Share one dB reference (the narrowband peak) so spreading's level drop is visible.
    const narrowLin = magnitudeSpectrumLinear(held, 'hann');
    const spreadLin = magnitudeSpectrumLinear(spreadSig, 'hann');
    const ref = Math.max(...narrowLin);
    return {
      narrow: toDb(narrowLin, -80, ref),
      spread: toDb(spreadLin, -80, ref),
    };
  }, [factor]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <PlotTitle>Narrowband data (before spreading)</PlotTitle>
        <SpectrumPlot
          data={narrow}
          height={130}
          yLabel={AXIS.magnitudeDb}
          xLabel={AXIS.normalizedFrequency}
          ariaLabel="Narrowband data spectrum"
        />
      </div>
      <div>
        <PlotTitle>Spread signal (after × PN code)</PlotTitle>
        <SpectrumPlot
          data={spread}
          height={130}
          yLabel={AXIS.magnitudeDb}
          xLabel={AXIS.normalizedFrequency}
          ariaLabel="Spread-spectrum signal spectrum"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Slider
          label="Spreading factor L"
          value={factor}
          min={2}
          max={32}
          step={2}
          unit=" chips/bit"
          onChange={setFactor}
          style={{ minWidth: 240 }}
          ariaLabel="Spreading factor (chips per bit)"
        />
        <div className="readout flex flex-col rounded-md border border-border px-3 py-2 text-xs">
          <span className="text-text-faint">Processing gain</span>
          <span className="text-signal">{processingGainDb(factor).toFixed(1)} dB</span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            spreading by L widens the spectrum ~L× and drops it ~L× lower · de-spreading at the
            receiver collapses it back, lifting the signal {processingGainDb(factor).toFixed(0)} dB
            above interference — the &ldquo;hide under the noise floor&rdquo; trick behind GPS and
            CDMA
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
