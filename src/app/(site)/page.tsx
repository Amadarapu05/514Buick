import { ParallaxPhotoFloat } from "@/components/parallax-photo-float";
import { StarField } from "@/components/star-field";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("carousel_images")
    .select("url, alt_text")
    .order("sort_order");

  const slides =
    images && images.length > 0
      ? images.map((img) => ({
          url: img.url,
          alt: img.alt_text ?? undefined,
        }))
      : undefined;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#03030a]">
      {/* Star field canvas */}
      <StarField />

      {/* Subtle gold vignette on the left to frame the hero text */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%]"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 20% 55%, rgba(201,162,39,0.04) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Main layout */}
      <div className="relative z-10 flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
        {/* Hero text */}
        <div className="flex shrink-0 items-center justify-center py-8 pl-14 pr-8 md:w-[45%] md:justify-end md:pl-20 md:pr-12 lg:w-[42%] lg:pl-28 lg:pr-16">
          <div className="flex flex-col gap-3">
            <h1 className="animate-buick-fonts animate-glow-pulse animate-slide-in-left text-5xl font-bold leading-none tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
              514 Buick
            </h1>
            {/* Gold accent divider */}
            <div
              className="animate-fade-in delay-400 mt-1 h-px w-16"
              style={{
                background: "linear-gradient(90deg, #c9a227, transparent)",
              }}
              aria-hidden
            />
          </div>
        </div>

        {/* Parallax photo float */}
        <div className="animate-fade-in delay-200 relative min-h-[50vw] flex-1 md:min-h-0">
          <ParallaxPhotoFloat slides={slides} />
        </div>
      </div>
    </div>
  );
}
