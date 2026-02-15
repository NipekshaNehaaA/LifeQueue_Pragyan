import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import ECGWaveform from './ECGWaveform';

describe('Feature: llm-driven-real-time-triage, Property 12: ECG Pattern Selection', () => {
  it('should display smooth pattern for HR <= 100 and chaotic pattern for HR > 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 200 }), // Valid heart rate range
        (heartRate) => {
          const { unmount } = render(
            <ECGWaveform heartRate={heartRate} isLive={false} />
          );

          // Verify the heart rate is displayed
          const hrDisplay = screen.getByText(`${heartRate} bpm`);
          expect(hrDisplay).toBeTruthy();

          // Verify pattern type label
          if (heartRate <= 100) {
            expect(screen.getByText('Normal Rhythm')).toBeTruthy();
          } else {
            expect(screen.getByText('Tachycardia')).toBeTruthy();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use NORMAL_PATTERN for heart rates at or below 100 bpm', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 100 }),
        (heartRate) => {
          const { unmount } = render(
            <ECGWaveform heartRate={heartRate} isLive={false} />
          );

          // Verify normal rhythm label is shown
          expect(screen.getByText('Normal Rhythm')).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use TACHYCARDIA_PATTERN for heart rates above 100 bpm', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 200 }),
        (heartRate) => {
          const { unmount } = render(
            <ECGWaveform heartRate={heartRate} isLive={false} />
          );

          // Verify tachycardia label is shown
          expect(screen.getByText('Tachycardia')).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Feature: llm-driven-real-time-triage, Property 13: ECG Waveform Reactivity', () => {
  it('should update waveform pattern when heart rate changes category', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 100 }), // Start with normal HR
        fc.integer({ min: 101, max: 200 }), // Change to tachycardia HR
        (normalHR, tachycardiaHR) => {
          const { rerender, unmount } = render(
            <ECGWaveform heartRate={normalHR} isLive={false} />
          );

          // Initially should show Normal Rhythm
          expect(screen.getByText('Normal Rhythm')).toBeTruthy();
          expect(screen.getByText(`${normalHR} bpm`)).toBeTruthy();

          // Update to tachycardia heart rate
          rerender(<ECGWaveform heartRate={tachycardiaHR} isLive={false} />);

          // Should now show Tachycardia
          expect(screen.getByText('Tachycardia')).toBeTruthy();
          expect(screen.getByText(`${tachycardiaHR} bpm`)).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update waveform pattern when changing from tachycardia to normal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 200 }), // Start with tachycardia HR
        fc.integer({ min: 40, max: 100 }), // Change to normal HR
        (tachycardiaHR, normalHR) => {
          const { rerender, unmount } = render(
            <ECGWaveform heartRate={tachycardiaHR} isLive={false} />
          );

          // Initially should show Tachycardia
          expect(screen.getByText('Tachycardia')).toBeTruthy();
          expect(screen.getByText(`${tachycardiaHR} bpm`)).toBeTruthy();

          // Update to normal heart rate
          rerender(<ECGWaveform heartRate={normalHR} isLive={false} />);

          // Should now show Normal Rhythm
          expect(screen.getByText('Normal Rhythm')).toBeTruthy();
          expect(screen.getByText(`${normalHR} bpm`)).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
