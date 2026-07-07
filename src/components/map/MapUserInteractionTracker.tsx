import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useMapViewportInsets } from '../../lib/mapViewportInsets';

/** Marks the map as user-positioned after pan/zoom so auto-fit pauses until selection changes. */
export function MapUserInteractionTracker() {
  const map = useMap();
  const { markUserMoved } = useMapViewportInsets();

  useMapEvents({
    dragstart: () => markUserMoved(),
    zoomstart: () => markUserMoved(),
  });

  useEffect(() => {
    const onWheel = () => markUserMoved();
    const container = map.getContainer();
    container.addEventListener('wheel', onWheel, { passive: true });
    return () => container.removeEventListener('wheel', onWheel);
  }, [map, markUserMoved]);

  return null;
}
