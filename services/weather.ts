const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

export type WeatherSummary = {
  tempF: number;
  description: string;
  city?: string;
  icon?: string;
};

function requireWeatherKey(): string {
  const key = process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!key) {
    throw new Error('Missing EXPO_PUBLIC_OPENWEATHERMAP_API_KEY env variable');
  }
  return key;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSummary> {
  const apiKey = requireWeatherKey();
  const url = `${WEATHER_URL}?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenWeatherMap error ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  const temp = data?.main?.temp;
  if (typeof temp !== 'number') {
    throw new Error('OpenWeatherMap response missing temperature');
  }

  const description: string = data?.weather?.[0]?.description ?? 'Unknown conditions';
  const icon: string | undefined = data?.weather?.[0]?.icon;
  const city: string | undefined = data?.name;

  return {
    tempF: temp,
    description,
    icon,
    city,
  };
}
