import { useState, useEffect, useRef } from "react";

const KEY = "e8668079";

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Cache en memoria para evitar peticiones repetidas
  const cache = useRef({});

  // Estado para aplicar debounce
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce: espera 500ms después de que el usuario deje de escribir
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("");

        // Si ya está en cache → no hacemos fetch
        if (cache.current[debouncedQuery]) {
          setMovies(cache.current[debouncedQuery]);
          setIsLoading(false);
          return;
        }

        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&s=${debouncedQuery}`,
          { signal: controller.signal }
        );

        if (!res.ok)
          throw new Error("Something went wrong with fetching movies");

        const data = await res.json();
        if (data.Response === "False") throw new Error("Movie not found");

        // Guardamos en cache
        cache.current[debouncedQuery] = data.Search;

        setMovies(data.Search);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log(err.message);
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (debouncedQuery.length < 3) {
      setMovies([]);
      setError("");
      return;
    }

    fetchMovies();

    return () => controller.abort();
  }, [debouncedQuery]);

  return { movies, isLoading, error };
}
