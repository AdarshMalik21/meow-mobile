export function trimCity(city: string): string {
  return city.trim().replace(/\s+/g, ' ');
}

export function routeLabel(fromCity: string, toCity: string): string {
  return `${fromCity} → ${toCity}`;
}
