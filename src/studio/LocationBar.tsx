import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  currentLocation,
  defaultMethod,
  searchCity,
  type CitySearchResult,
} from "@/lib/geo";
import { getMethods } from "@/lib/miqaat";
import { useStudio } from "./Studio";

const DEBOUNCE_MS = 300;

export function LocationBar() {
  const { state, updateState, methodOverridden, setMethodOverridden } = useStudio();

  const [query, setQuery] = useState(state.city);
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([]);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getMethods()
      .then(setMethods)
      .catch((err: unknown) => {
        setMethodsError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      searchCity(q)
        .then((found) => {
          setResults(found);
          setResultsOpen(found.length > 0);
        })
        .catch((err: unknown) => {
          setSearchError(err instanceof Error ? err.message : String(err));
          setResults([]);
        })
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectCity(result: CitySearchResult) {
    updateState({
      lat: result.lat,
      lon: result.lon,
      city: result.name,
      ...(methodOverridden ? {} : { method: defaultMethod(result.country) }),
    });
    setQuery(result.name);
    setResultsOpen(false);
  }

  function useMyLocation() {
    setLocating(true);
    setLocateError(null);
    currentLocation()
      .then(({ lat, lon }) => {
        const label = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        updateState({ lat, lon, city: label });
        setQuery(label);
      })
      .catch((err: unknown) => {
        setLocateError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLocating(false));
  }

  function changeMethod(method: string) {
    setMethodOverridden(true);
    updateState({ method });
  }

  function changeMadhab(madhab: string) {
    updateState({ madhab });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="location-search">Location</Label>

      <Popover open={resultsOpen} onOpenChange={setResultsOpen}>
        <PopoverTrigger
          render={
            <Input
              id="location-search"
              value={query}
              placeholder="Search for a city…"
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
          }
        />
        <PopoverContent align="start" className="p-1">
          {searching && <p className="px-2 py-1.5 text-xs text-muted-foreground">Searching…</p>}
          {searchError && (
            <p className="px-2 py-1.5 text-xs text-destructive" role="alert">
              {searchError}
            </p>
          )}
          {!searching &&
            !searchError &&
            results.map((r) => (
              <button
                key={`${r.name}-${r.lat}-${r.lon}`}
                type="button"
                className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => selectCity(r)}
              >
                <span>{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.country}</span>
              </button>
            ))}
          {!searching && !searchError && results.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No matches yet.</p>
          )}
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? "Locating…" : "Use my location"}
        </Button>

        <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" />}>
            Advanced
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="method-select">Calculation method</Label>
                <Select
                  value={state.method}
                  onValueChange={(value) => changeMethod(String(value))}
                >
                  <SelectTrigger id="method-select" className="w-full">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {methodsError && (
                  <p className="text-xs text-destructive" role="alert">
                    {methodsError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="madhab-switch">Hanafi Asr timing</Label>
                <Switch
                  id="madhab-switch"
                  checked={state.madhab === "hanafi"}
                  onCheckedChange={(checked) => changeMadhab(checked ? "hanafi" : "shafi")}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {locateError && (
        <p className="text-xs text-destructive" role="alert">
          {locateError}
        </p>
      )}
    </div>
  );
}

export default LocationBar;
