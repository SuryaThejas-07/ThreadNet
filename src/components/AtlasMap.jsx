import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const defaultCenter = { lat: 21.1466, lng: 79.0889 };

const AtlasMap = ({ center = defaultCenter, zoom = 4, markers = [], activeMarkerName = '', onMarkerClick = () => {} }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);

  const style = useMemo(() => ({
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
      },
    ],
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [center.lng || defaultCenter.lng, center.lat || defaultCenter.lat],
      zoom,
      attributionControl: true,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();

    return () => {
      if (mapRef.current) {
        markerRefs.current.forEach((marker) => marker.remove());
        markerRefs.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [style, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    markers.forEach((m) => {
      if (!m || typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
      const el = document.createElement('div');
      el.className = `atlas-marker ${m.name === activeMarkerName ? 'is-active' : ''}`;
      el.style.width = m.name === activeMarkerName ? '18px' : '14px';
      el.style.height = m.name === activeMarkerName ? '18px' : '14px';
      el.style.borderRadius = '50%';
      el.style.background = m.name === activeMarkerName ? '#ff8a4c' : '#17b6b3';
      el.style.boxShadow = m.name === activeMarkerName ? '0 0 18px rgba(255,138,76,0.85)' : '0 0 14px rgba(23,182,179,0.85)';
      el.style.border = '2px solid rgba(255,255,255,0.95)';
      el.title = m.name || '';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `Focus ${m.name}`);
      el.onclick = () => {
        onMarkerClick(m);
      };
      el.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onMarkerClick(m);
        }
      };

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        className: 'atlas-popup',
      }).setHTML(`<div style="font-weight:800;font-size:12px;color:#10212b;">${m.name}</div><div style="font-size:11px;color:#4c6476;margin-top:2px;">Click to focus this city</div>`);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(m.lng), Number(m.lat)])
        .setPopup(popup)
        .addTo(mapRef.current);

      marker.getElement().addEventListener('mouseenter', () => marker.togglePopup());
      marker.getElement().addEventListener('mouseleave', () => {
        marker.getPopup()?.remove();
      });
      markerRefs.current.push(marker);
    });
    if (markers?.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => {
        if (typeof m.lat === 'number' && typeof m.lng === 'number') {
          bounds.extend([m.lng, m.lat]);
        }
      });
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: 48, duration: 700, maxZoom: 6 });
      }
    } else if (markers?.[0]) {
      mapRef.current.easeTo({ center: [markers[0].lng, markers[0].lat], duration: 700, zoom: Math.max(zoom, 5) });
    }
  }, [activeMarkerName, markers, onMarkerClick, zoom]);

  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.easeTo({ center: [center.lng || defaultCenter.lng, center.lat || defaultCenter.lat], duration: 500 });
  }, [center.lat, center.lng]);

  return <div ref={containerRef} className="atlas-map" aria-label="Interactive Atlas map" />;
};

export default AtlasMap;
