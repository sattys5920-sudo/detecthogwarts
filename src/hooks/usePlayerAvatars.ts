import { useEffect, useState } from 'react';
import { listenAllPlayers } from '../firebase/players';

interface PlayerAvatarMaps {
  byId: Record<string, string | null>;
  byNickname: Record<string, string | null>;
}

const EMPTY: PlayerAvatarMaps = { byId: {}, byNickname: {} };

/**
 * Live playerId/nickname -> avatarDataUrl lookups. Chat messages often store an avatar snapshot
 * at send time, which goes stale (or was never set) if the player adds/changes their profile
 * picture later — this always resolves to whatever they currently have set.
 */
export function usePlayerAvatars(): PlayerAvatarMaps {
  const [maps, setMaps] = useState<PlayerAvatarMaps>(EMPTY);

  useEffect(
    () =>
      listenAllPlayers((players) => {
        const byId: Record<string, string | null> = {};
        const byNickname: Record<string, string | null> = {};
        for (const p of players) {
          byId[p.id] = p.avatarDataUrl;
          if (p.nickname) byNickname[p.nickname] = p.avatarDataUrl;
        }
        setMaps({ byId, byNickname });
      }),
    [],
  );

  return maps;
}
