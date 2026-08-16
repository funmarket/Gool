import { useEffect, useRef } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  accent?: boolean;
};

const FALLBACK_CENTER: [number, number] = [-73.9857, 40.7484];

setWorkerUrl(mapLibreWorkerUrl);

export function MapPanel({
  points,
  center,
  onPoint,
}: {
  points: MapPoint[];
  center?: [number, number];
  onPoint?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const initialCenter = useRef<[number, number]>(center ?? FALLBACK_CENTER);
  const initialZoom = useRef(center ? 12 : 2);
  const centerLng = center?.[0];
  const centerLat = center?.[1];

  useEffect(() => {
    if (!ref.current || map.current) return undefined;

    const instance = new Map({
      container: ref.current,
      style: '/map-style.json',
      center: initialCenter.current,
      zoom: initialZoom.current,
      attributionControl: false,
    });
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.current = instance;

    return () => {
      instance.remove();
      if (map.current === instance) map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (instance && centerLng != null && centerLat != null) {
      instance.easeTo({ center: [centerLng, centerLat], zoom: 12, duration: 500 });
    }
  }, [centerLng, centerLat]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;

    const markers = points.map((point) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.title = point.label;
      element.style.cssText = [
        'width:28px',
        'height:28px',
        'border-radius:50%',
        'border:3px solid var(--bg)',
        'background:var(--accent)',
        'box-shadow:0 6px 16px rgba(0,0,0,.3)',
        'cursor:pointer',
      ].join(';');
      element.onclick = () => onPoint?.(point.id);
      return new Marker({ element }).setLngLat([point.lng, point.lat]).addTo(instance);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [points, onPoint]);

  return (
    <div
      ref={ref}
      className="h-[320px] w-full overflow-hidden rounded-[24px] border"
      style={{ borderColor: 'var(--border)' }}
    />
  );
}
