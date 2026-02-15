import { useState, useEffect, useCallback, useRef } from 'react';

export interface VitalsData {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  spO2: number;
  respiratoryRate: number;
  timestamp: Date;
}

export interface UseVitalsBreathingReturn {
  vitals: VitalsData;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

interface UseVitalsBreathingOptions {
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spO2?: number;
  respiratoryRate?: number;
}

// Medical bounds for vital signs
const BOUNDS = {
  heartRate: { min: 40, max: 200 },
  systolicBP: { min: 80, max: 250 },
  diastolicBP: { min: 40, max: 150 },
  spO2: { min: 85, max: 100 },
  respiratoryRate: { min: 10, max: 30 },
};

// Fluctuation ranges
const FLUCTUATION = {
  heartRate: { min: 1, max: 3 },
  systolicBP: { min: 1, max: 2 },
  diastolicBP: { min: 1, max: 1 },
};

/**
 * Generates a random fluctuation within the specified range
 */
function getRandomFluctuation(min: number, max: number): number {
  const range = max - min + 1;
  const value = Math.floor(Math.random() * range) + min;
  return Math.random() < 0.5 ? -value : value;
}

/**
 * Clamps a value within the specified bounds
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Custom hook for simulating live vital signs with breathing effect
 * 
 * @param baseValues - Initial values for vital signs
 * @returns Object containing vitals state and control functions
 */
export function useVitalsBreathing(
  baseValues: UseVitalsBreathingOptions = {}
): UseVitalsBreathingReturn {
  // Initialize with base values or defaults
  const [vitals, setVitals] = useState<VitalsData>({
    heartRate: baseValues.heartRate ?? 75,
    systolicBP: baseValues.systolicBP ?? 120,
    diastolicBP: baseValues.diastolicBP ?? 80,
    spO2: baseValues.spO2 ?? 98,
    respiratoryRate: baseValues.respiratoryRate ?? 16,
    timestamp: new Date(),
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Updates vital signs with random fluctuations while enforcing medical bounds
   */
  const updateVitals = useCallback(() => {
    setVitals((prev) => {
      // Apply random fluctuations
      const hrFluctuation = getRandomFluctuation(
        FLUCTUATION.heartRate.min,
        FLUCTUATION.heartRate.max
      );
      const systolicFluctuation = getRandomFluctuation(
        FLUCTUATION.systolicBP.min,
        FLUCTUATION.systolicBP.max
      );
      const diastolicFluctuation = getRandomFluctuation(
        FLUCTUATION.diastolicBP.min,
        FLUCTUATION.diastolicBP.max
      );

      // Calculate new values with bounds enforcement
      const newHeartRate = clamp(
        prev.heartRate + hrFluctuation,
        BOUNDS.heartRate.min,
        BOUNDS.heartRate.max
      );
      const newSystolicBP = clamp(
        prev.systolicBP + systolicFluctuation,
        BOUNDS.systolicBP.min,
        BOUNDS.systolicBP.max
      );
      const newDiastolicBP = clamp(
        prev.diastolicBP + diastolicFluctuation,
        BOUNDS.diastolicBP.min,
        BOUNDS.diastolicBP.max
      );

      return {
        ...prev,
        heartRate: newHeartRate,
        systolicBP: newSystolicBP,
        diastolicBP: newDiastolicBP,
        timestamp: new Date(),
      };
    });
  }, []);

  /**
   * Starts the vital signs simulation
   */
  const startSimulation = useCallback(() => {
    if (!isSimulating) {
      setIsSimulating(true);
    }
  }, [isSimulating]);

  /**
   * Stops the vital signs simulation
   */
  const stopSimulation = useCallback(() => {
    if (isSimulating) {
      setIsSimulating(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isSimulating]);

  // Effect to manage the simulation interval
  useEffect(() => {
    if (isSimulating) {
      // Update every 2 seconds
      intervalRef.current = setInterval(updateVitals, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating, updateVitals]);

  return {
    vitals,
    isSimulating,
    startSimulation,
    stopSimulation,
  };
}
