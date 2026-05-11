import { useRef, useState, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

export interface UseAudioReturn {
  play: (src: string) => void;
  stop: () => void;
  isPlaying: boolean;
  hasError: boolean;
}

export function useAudio(): UseAudioReturn {
  const howlRef = useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioEnabled = localStorage.getItem('audioEnabled') !== 'false';

  const stop = useCallback(() => {
    howlRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    (src: string) => {
      if (!audioEnabled) return;
      stop();
      setHasError(false);
      const howl = new Howl({
        src: [src],
        onplay: () => setIsPlaying(true),
        onend: () => setIsPlaying(false),
        onstop: () => setIsPlaying(false),
        onloaderror: () => {
          setHasError(true);
          setIsPlaying(false);
        },
        onplayerror: () => {
          setHasError(true);
          setIsPlaying(false);
        },
      });
      howlRef.current = howl;
      howl.play();
    },
    [audioEnabled, stop]
  );

  useEffect(() => () => {
    howlRef.current?.unload();
  }, []);

  return { play, stop, isPlaying, hasError };
}
