/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeocodedLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country_code?: string;
  timezone: string;
  country?: string;
  admin1?: string; // State / Province
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  uv_index: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  relative_humidity_2m: number[];
  uv_index: number[];
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  precipitation_probability_max: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

export interface WeatherResponse {
  weather: WeatherData;
  briefing: string | null;
  provider: string;
}

export interface AppToast {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  timestamp: string;
}

export interface LiveTileState {
  size: "small" | "medium" | "wide" | "large";
  theme: "blue" | "dark" | "teal" | "purple" | "crimson";
  showTemp: boolean;
  showIcon: boolean;
  pulseAnimation: boolean;
}

export interface StorePackageManifest {
  packageIdentityName: string;
  publisherDisplayName: string;
  publisherId: string;
  packageVersion: string;
  displayName: string;
  description: string;
  capabilities: {
    internetClient: boolean;
    location: boolean;
  };
}
