import { useEffect, useState } from 'react';

export default function useMediaQuery(query) {
  const get = () =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatch(e.matches);
    mql.addEventListener('change', handler);
    setMatch(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return match;
}
