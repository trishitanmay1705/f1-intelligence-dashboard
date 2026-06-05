import json
import os
import hashlib
import time
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)


class FileCache:
    """
    Simple file-based JSON cache.
    - Permanent entries (ttl=None): never expire — for historical data
    - TTL entries: expire after N seconds — for "current" season data
    """

    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def _path(self, key: str) -> str:
        # Hash to avoid filesystem-unsafe characters
        h = hashlib.md5(key.encode()).hexdigest()
        return os.path.join(self.cache_dir, f"{h}.json")

    def get(self, key: str) -> Optional[Any]:
        path = self._path(key)
        if not os.path.exists(path):
            return None

        try:
            with open(path, "r", encoding="utf-8") as f:
                entry = json.load(f)

            # Check expiry
            expires_at = entry.get("expires_at")
            if expires_at is not None and time.time() > expires_at:
                logger.info(f"Cache EXPIRED: {key}")
                os.remove(path)
                return None

            logger.info(f"Cache HIT: {key}")
            return entry["value"]
        except (json.JSONDecodeError, KeyError, OSError) as e:
            logger.warning(f"Cache read failed for {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Store a value.
        - ttl=None    → permanent (for historical data)
        - ttl=300     → expires in 5 minutes (for current/live data)
        """
        path = self._path(key)
        entry = {
            "key": key,
            "value": value,
            "expires_at": time.time() + ttl if ttl else None,
        }
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(entry, f)
            logger.info(f"Cache SET: {key} (ttl={ttl})")
        except OSError as e:
            logger.warning(f"Cache write failed for {key}: {e}")

    def clear(self) -> int:
        """Clear all cached entries. Returns number of files deleted."""
        count = 0
        for fname in os.listdir(self.cache_dir):
            if fname.endswith(".json"):
                os.remove(os.path.join(self.cache_dir, fname))
                count += 1
        return count


cache = FileCache()