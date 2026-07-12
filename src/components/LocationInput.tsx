import { useEffect, useRef, useState } from "react";
import { placesAutocomplete, placeDetails } from "@/lib/maps.actions";
import { loadMapsScript } from "@/lib/maps-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed, MapPin, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type LocationValue = {
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
};

type Props = {
  value: LocationValue | null;
  onChange: (v: LocationValue | null) => void;
  placeholder?: string;
  biasLat?: number;
  biasLng?: number;
};

function randomToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function LocationInput({ value, onChange, placeholder, biasLat, biasLng }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ placeId: string; main: string; secondary: string }>
  >([]);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sessionTokenRef = useRef<string>(randomToken());
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2 || value?.label === query) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await placesAutocomplete({
          input: query, sessionToken: sessionTokenRef.current, biasLat, biasLng,
        });
        setSuggestions(res);
        setActiveIndex(-1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, biasLat, biasLng, value?.label]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function pick(placeId: string, label: string) {
    setOpen(false);
    setActiveIndex(-1);
    try {
      const d = await placeDetails({ placeId, sessionToken: sessionTokenRef.current });
      sessionTokenRef.current = randomToken();
      onChange({ label: d.label, lat: d.lat, lng: d.lng, placeId: d.placeId });
      setQuery(d.label);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't fetch place");
      // fallback: use main label if details fail
      onChange({ label, lat: 0, lng: 0, placeId });
      setQuery(label);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          const s = suggestions[activeIndex];
          pick(s.placeId, s.main);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await loadMapsScript();
          if (!window.google?.maps) throw new Error("Google Maps script not loaded");

          const geocoder = new window.google.maps.Geocoder();
          const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
            geocoder.geocode(
              { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
              (results, status) => {
                if (status === "OK" && results) {
                  resolve({ results });
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              }
            );
          });

          const first = response.results?.[0];
          if (first) {
            const label = first.formatted_address;
            onChange({
              label,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              placeId: first.place_id,
            });
            setQuery(label);
          } else {
            throw new Error("No address found for these coordinates");
          }
        } catch (e) {
          console.error(e);
          onChange({
            label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } finally {
          setGpsBusy(false);
        }
      },
      (err) => {
        setGpsBusy(false);
        toast.error(err.message || "Couldn't get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const displayValue = value?.label ?? query;
  const isSelected = !!value;

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        {isSelected ? (
          <CheckCircle2 className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-success" />
        ) : (
          <MapPin className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Search a place"}
          className={cn("pl-8 pr-20", isSelected && "border-success/40")}
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-autocomplete="list"
        />
        <div className="absolute right-1 top-1 flex gap-0.5">
          {(value || query) && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setQuery("");
                onChange(null);
                setSuggestions([]);
                setActiveIndex(-1);
              }}
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={useCurrentLocation}
            disabled={gpsBusy}
            aria-label="Use current location"
            title="Use current location"
          >
            {gpsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      {open && (query.length >= 2 || loading) && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg" role="listbox">
          {loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching…
            </div>
          )}
          {!loading && suggestions.length === 0 && query.length >= 2 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No results</div>
          )}
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={s.placeId}
              onClick={() => pick(s.placeId, s.main)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors",
                i === activeIndex ? "bg-muted" : "hover:bg-muted/50",
              )}
              role="option"
              aria-selected={i === activeIndex}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium">{s.main}</div>
                {s.secondary && <div className="truncate text-xs text-muted-foreground">{s.secondary}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}