import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const lat = process.env.WEATHER_LAT ?? "42.3601";
  const lon = process.env.WEATHER_LON ?? "-71.0589";

  if (!apiKey) {
    return NextResponse.json({
      temp: null,
      description: "Configure OPENWEATHER_API_KEY",
      city: "Boston",
    });
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`,
    { next: { revalidate: 600 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({
    temp: Math.round(data.main.temp),
    description: data.weather[0]?.description ?? "",
    city: data.name,
    icon: data.weather[0]?.icon,
  });
}
