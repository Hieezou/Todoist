import React, { createContext, useState, useEffect, useContext } from 'react';
import { isAvailable } from './haptics';

const HapticsContext = createContext({ available: false });

export const HapticsProvider = ({ children }) => {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await isAvailable();
      if (mounted) setAvailable(ok);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <HapticsContext.Provider value={{ available }}>
      {children}
    </HapticsContext.Provider>
  );
};

export const useHaptics = () => useContext(HapticsContext);

export default HapticsProvider;
