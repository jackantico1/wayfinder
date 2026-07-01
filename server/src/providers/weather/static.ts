import type { WeatherProvider } from './types';
import { getClimateNormal } from '../../data/climate';

// Static climate-normals lookup — reliable and offline. A live weather API is a
// fine later upgrade behind this same interface.
export const staticWeatherProvider: WeatherProvider = {
  getClimate(destinationId, month) {
    return getClimateNormal(destinationId, month);
  },
};
