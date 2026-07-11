import { useState, useCallback } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const debounce = useCallback(
    (() => {
      let timer;
      return (val) => {
        clearTimeout(timer);
        timer = setTimeout(() => setDebouncedValue(val), delay);
      };
    })(),
    [delay]
  );

  return [debouncedValue, debounce, setDebouncedValue];
}
