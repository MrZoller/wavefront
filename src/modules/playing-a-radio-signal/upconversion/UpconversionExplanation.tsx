/** "Go deeper" content for the Up/Downconversion module. */
export function UpconversionExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Baseband is slow; the air wants a carrier</h3>
        <p>
          Your shaped symbols sit near 0 Hz (baseband), but antennas and spectrum allocations live
          at much higher frequencies. <em>Upconversion</em> multiplies baseband by a carrier to
          slide it up to the transmit band; the spectrum shifts, the information doesn&rsquo;t.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">One real wire, two rails</h3>
        <p>The complex baseband I + jQ becomes a single real waveform:</p>
        <p className="readout my-2 text-signal">s(t) = I(t)·cos(2πf꜀t) − Q(t)·sin(2πf꜀t)</p>
        <p>
          Cosine and sine are 90° apart (&ldquo;in-phase&rdquo; and &ldquo;quadrature&rdquo;), so
          two independent streams ride one carrier without colliding — that&rsquo;s how QPSK/QAM fit
          twice the data on the same tone.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Mixing back down</h3>
        <p>
          Multiply the received passband by the same cosine and sine again. Each product yields the
          wanted baseband term plus an image at twice the carrier; a <em>low-pass filter</em> throws
          the image away, leaving I and Q exactly as sent.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        Idealized: the receiver&rsquo;s carrier is assumed perfectly aligned in frequency and phase.
        Recovering that alignment (carrier &amp; timing sync) is a later track. All signals are
        synthetic.
      </section>
    </div>
  );
}
