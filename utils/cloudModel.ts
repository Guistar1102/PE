
import { CloudParams } from '../types';

/**
 * Backward Cloud Generator: Calculate Ex, En, He from a sample of scores.
 */
export const calculateCloudParams = (scores: number[]): CloudParams => {
  if (scores.length === 0) return { ex: 0, en: 0, he: 0 };
  
  const n = scores.length;
  // 1. Calculate Expected Value (Ex)
  const ex = scores.reduce((a, b) => a + b, 0) / n;
  
  // 2. Calculate Entropy (En)
  // En = sqrt(pi/2) * (1/n) * sum(|xi - Ex|)
  const sumAbsDiff = scores.reduce((acc, x) => acc + Math.abs(x - ex), 0);
  const en = Math.sqrt(Math.PI / 2) * (sumAbsDiff / n);
  
  // 3. Calculate Hyper-entropy (He)
  // Variance S^2
  const variance = scores.reduce((acc, x) => acc + Math.pow(x - ex, 2), 0) / (n - 1 || 1);
  const he = Math.sqrt(Math.abs(variance - Math.pow(en, 2)));
  
  return { ex, en, he };
};

/**
 * Generate cloud drops for visualization using Normal Distribution.
 */
export const generateCloudDrops = (params: CloudParams, count: number = 1000) => {
  const { ex, en, he } = params;
  const drops: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    // Generate En' ~ N(En, He^2)
    const enPrime = randomNormal(en, he);
    // Generate xi ~ N(Ex, En'^2)
    const xi = randomNormal(ex, Math.abs(enPrime));
    // Degree of membership mu = exp(-(xi - Ex)^2 / (2 * En'^2))
    const mu = Math.exp(-Math.pow(xi - ex, 2) / (2 * Math.pow(enPrime, 2)));
    
    drops.push({ x: xi, y: mu });
  }
  return drops;
};

// Box-Muller transform for normal distribution
function randomNormal(mean: number, stdDev: number) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

/**
 * Weighted aggregation of cloud models
 * Simplified: Aggregation of n clouds with weights
 */
export const aggregateClouds = (
  indicatorClouds: CloudParams[], 
  weightClouds: CloudParams[]
): CloudParams => {
  let sumWEx = weightClouds.reduce((a, b) => a + b.ex, 0) || 1;
  
  // Normalize weights ex values
  const normalizedWEx = weightClouds.map(w => w.ex / sumWEx);
  
  const finalEx = indicatorClouds.reduce((acc, cloud, i) => acc + cloud.ex * normalizedWEx[i], 0);
  const finalEn = Math.sqrt(indicatorClouds.reduce((acc, cloud, i) => acc + Math.pow(cloud.en, 2) * normalizedWEx[i], 0));
  const finalHe = indicatorClouds.reduce((acc, cloud, i) => acc + cloud.he * normalizedWEx[i], 0);

  return { ex: finalEx, en: finalEn, he: finalHe };
};
