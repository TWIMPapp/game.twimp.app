import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-rotate';
import 'leaflet/dist/leaflet.css';
import MarkerIconImg from '@/assets/icons/marker-icon.png';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';

const LAST_KNOWN_KEY = 'twimp_last_known_location';
import { SmoothMapController } from '@/utils/SmoothMapController';

const MarkerColourMap: Record<Colour, string> = {
  [Colour.Green]: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  [Colour.Red]: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  [Colour.Yellow]: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  [Colour.Blue]: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  [Colour.Purple]: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  [Colour.Pink]: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  [Colour.Orange]: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
};

const colorToHex: Record<string, string> = {
  blue: '#3B82F6',
  orange: '#F97316',
  green: '#22C55E',
  red: '#EF4444',
  gold: '#FFD700',
  yellow: '#EAB308',
  purple: '#A855F7',
  pink: '#EC4899'
};

const emojiToIconUrl = (emoji: string, size = 48, bgColor?: string): string => {
  const bg = bgColor
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${bgColor}" fill-opacity="0.85" stroke="white" stroke-width="2"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bg}<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${Math.round(
    size * (bgColor ? 0.55 : 0.75)
  )}">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMarkerIconUrl(marker: Marker): string {
  if (marker?.emoji) return emojiToIconUrl(marker.emoji, 48, marker.emojiBg);
  if (marker?.image_url) return marker.image_url;
  if (marker?.colour && MarkerColourMap[marker.colour as Colour]) {
    return MarkerColourMap[marker.colour as Colour];
  }
  return MarkerColourMap[Colour.Red];
}

function createTaskMarkerIcon(marker: Marker, showLabel?: boolean) {
  const isColoredEgg = marker.title?.toLowerCase().includes('egg') && marker.colour;
  const iconSize = isColoredEgg ? 64 : 48;
  const iconUrl = getMarkerIconUrl(marker);
  const labelHtml =
    showLabel && marker.title
      ? `<div style="
          margin-top: 2px;
          background-color: rgba(0,0,0,0.72);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        ">${escapeHtml(marker.title)}</div>`
      : '';

  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
      <img src="${iconUrl}" alt="" style="width:${iconSize}px;height:${iconSize}px;display:block;pointer-events:none;" />
      ${labelHtml}
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

function createPlayerDotIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 14px;
      height: 14px;
      margin-left: -7px;
      margin-top: -7px;
      border-radius: 50%;
      background-color: #4285F4;
      border: 2px solid white;
      box-shadow: 0 0 0 1px rgba(66, 133, 244, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2);
      pointer-events: none;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [0, 0]
  });
}

function createDraggableTestIcon() {
  return L.icon({
    iconUrl: MarkerIconImg.src,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
}

function createOffScreenIndicatorIcon(colour: string | undefined, angleDeg: number, distText: string) {
  const bg = colour ? colorToHex[colour.toLowerCase()] || '#FF2E5B' : '#FF2E5B';
  return L.divIcon({
    className: 'off-screen-indicator',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);pointer-events:none;">
      <div style="transform:rotate(${angleDeg}deg);margin-bottom:4px;">
        <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:12px solid ${bg};"></div>
      </div>
      <div style="background:${bg};color:white;padding:4px 10px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.35);border:2px solid white;font-weight:700;font-size:11px;white-space:nowrap;">
        ${escapeHtml(distText)}
      </div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

function getEdgeIntersection(
  center: { x: number; y: number },
  target: { x: number; y: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): { x: number; y: number } {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  let t = Infinity;

  if (dx > 0) {
    const tRight = (bounds.maxX - center.x) / dx;
    if (tRight > 0) t = Math.min(t, tRight);
  } else if (dx < 0) {
    const tLeft = (bounds.minX - center.x) / dx;
    if (tLeft > 0) t = Math.min(t, tLeft);
  }

  if (dy > 0) {
    const tBottom = (bounds.maxY - center.y) / dy;
    if (tBottom > 0) t = Math.min(t, tBottom);
  } else if (dy < 0) {
    const tTop = (bounds.minY - center.y) / dy;
    if (tTop > 0) t = Math.min(t, tTop);
  }

  if (t === Infinity || t > 1) return target;

  return {
    x: center.x + dx * t,
    y: center.y + dy * t
  };
}

// The Leaflet container is 150% of the visible map height, clipped by the
// overflow-hidden wrapper. That puts the Leaflet container's geometric center
// (and leaflet-rotate's rotation pivot) at 0.5 * 1.5 = 75% down the visible
// map area (bottom third, just above the bottom white panel), so the player's
// location sits in the bottom third and the top 2/3 shows the space ahead.
const PIVOT_HEIGHT_MULTIPLIER = 1.5;

export interface RotatingTaskMapProps {
  taskMarkers: Marker[];
  userLocation: { lat: number; lng: number } | null;
  userAccuracy?: number;
  testMode?: boolean;
  onPlayerMove: (lat: number, lng: number) => void;
  zoom?: number;
  showMarkerLabels?: boolean;
  fitToMarkers?: boolean;
  recenterSignal?: number;
}

export default function RotatingTaskMap({
  taskMarkers,
  userLocation,
  userAccuracy = 10,
  testMode = false,
  onPlayerMove,
  zoom = 19,
  showMarkerLabels = false,
  fitToMarkers = false,
  recenterSignal = 0
}: RotatingTaskMapProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const ctrlRef = useRef<SmoothMapController | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const taskMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const offScreenLayerRef = useRef<L.LayerGroup | null>(null);
  const orientationRequestedRef = useRef(false);
  const hasFittedRef = useRef(false);

  const latestPropsRef = useRef({
    taskMarkers,
    userLocation,
    userAccuracy,
    testMode,
    onPlayerMove,
    zoom,
    showMarkerLabels,
    fitToMarkers
  });
  latestPropsRef.current = {
    taskMarkers,
    userLocation,
    userAccuracy,
    testMode,
    onPlayerMove,
    zoom,
    showMarkerLabels,
    fitToMarkers
  };

  const getInitialCenter = (): { lat: number; lng: number } => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_KNOWN_KEY) || 'null');
      if (saved && typeof saved.lat === 'number' && typeof saved.lng === 'number') {
        return { lat: saved.lat, lng: saved.lng };
      }
    } catch {}
    if (taskMarkers && taskMarkers.length > 0) {
      return { lat: taskMarkers[0].lat, lng: taskMarkers[0].lng };
    }
    return { lat: 51.481583, lng: -3.17909 };
  };

  const updateOffScreenIndicators = () => {
    const map = mapRef.current;
    const offLayer = offScreenLayerRef.current;
    if (!map || !offLayer) return;

    offLayer.clearLayers();
    const { taskMarkers: curMarkers, userLocation: curUser } = latestPropsRef.current;
    if (!curMarkers || curMarkers.length === 0) return;

    const mapSize = map.getSize();
    if (mapSize.x === 0 || mapSize.y === 0) return;

    // Visible height is the clipped wrapper height (mapSize.y / 1.5)
    const visibleHeight =
      wrapperRef.current && wrapperRef.current.clientHeight > 0
        ? wrapperRef.current.clientHeight
        : mapSize.y / PIVOT_HEIGHT_MULTIPLIER;

    const padding = 44;
    const edgeBounds = {
      minX: padding,
      maxX: mapSize.x - padding,
      minY: padding,
      maxY: Math.max(padding + 10, visibleHeight - padding)
    };
    // Ray origin is the rotation pivot (player position at 75% of visible height)
    const centerPoint = { x: mapSize.x / 2, y: mapSize.y / 2 };
    const acceptedPos = ctrlRef.current?.getAcceptedPosition();
    const refOrigin = acceptedPos || curUser || map.getCenter();

    curMarkers.forEach((marker) => {
      const mLatLng = L.latLng(marker.lat, marker.lng);
      const pt = map.latLngToContainerPoint(mLatLng);
      const isInView =
        pt.x >= 0 && pt.x <= mapSize.x && pt.y >= 0 && pt.y <= visibleHeight;
      if (isInView) return;

      const edgePos = getEdgeIntersection(centerPoint, pt, edgeBounds);
      const angle =
        Math.atan2(pt.y - centerPoint.y, pt.x - centerPoint.x) * (180 / Math.PI) + 90;
      const edgeLatLng = map.containerPointToLatLng([edgePos.x, edgePos.y]);

      const dist = map.distance([refOrigin.lat, refOrigin.lng], [marker.lat, marker.lng]);
      const distText = dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`;

      const ind = L.marker(edgeLatLng, {
        icon: createOffScreenIndicatorIcon(marker.colour, angle, distText),
        interactive: false
      });
      ind.addTo(offLayer);
    });
  };

  // Initialize Leaflet map + SmoothMapController once on mount
  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || mapRef.current) return;

    const initial = getInitialCenter();

    const map = L.map(container, {
      center: [initial.lat, initial.lng],
      zoom: latestPropsRef.current.zoom,
      zoomControl: false,
      attributionControl: false,
      // @ts-ignore — provided by leaflet-rotate
      rotate: true,
      rotateControl: false,
      touchRotate: true,
      shiftKeyRotate: true,
      bearing: 0
    } as L.MapOptions);

    // Satellite tiles (Google Satellite) so rotating map has no upside-down road labels
    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 22,
      maxNativeZoom: 20,
      keepBuffer: 6
    }).addTo(map);

    const taskLayer = L.layerGroup().addTo(map);
    const offLayer = L.layerGroup().addTo(map);
    taskMarkersLayerRef.current = taskLayer;
    offScreenLayerRef.current = offLayer;
    mapRef.current = map;

    const ctrl = new SmoothMapController(map, {
      tickMs: 1000,
      minBearingDeltaDeg: 7,
      bearingEmaAlpha: 0.08,
      minPositionDriftM: 1.2,
      maxGpsAccuracyM: 25,
      accuracyWindowSize: 10,
      accuracyMultiplier: 2,
      softFollowIdleMs: 10000
    });
    ctrl.setFollowMode('soft');
    ctrl.setRotationEnabled(true);
    ctrl.start();
    ctrlRef.current = ctrl;

    const handleMapChange = () => updateOffScreenIndicators();
    map.on('move zoom rotate resize', handleMapChange);

    // Recalculate size whenever wrapper dimensions change (e.g. returning from Journal)
    let ro: ResizeObserver | null = null;
    const observeTarget = wrapper || container;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          map.invalidateSize();
          updateOffScreenIndicators();
        }
      });
      ro.observe(observeTarget);
    }

    // Request iOS 13+ DeviceOrientation permission on first user interaction
    const requestOrientationOnFirstTap = () => {
      if (orientationRequestedRef.current) return;
      orientationRequestedRef.current = true;
      const DOE =
        typeof DeviceOrientationEvent !== 'undefined'
          ? (DeviceOrientationEvent as unknown as {
              requestPermission?: () => Promise<'granted' | 'denied'>;
            })
          : null;
      if (DOE && typeof DOE.requestPermission === 'function') {
        DOE.requestPermission()
          .then((res) => {
            if (res === 'granted') {
              ctrlRef.current?.setRotationEnabled(true);
            }
          })
          .catch(() => {});
      }
    };
    container.addEventListener('pointerdown', requestOrientationOnFirstTap, { passive: true });
    window.addEventListener('click', requestOrientationOnFirstTap, { once: true, passive: true });

    return () => {
      ro?.disconnect();
      container.removeEventListener('pointerdown', requestOrientationOnFirstTap);
      window.removeEventListener('click', requestOrientationOnFirstTap);
      map.off('move zoom rotate resize', handleMapChange);
      ctrl.destroy();
      ctrlRef.current = null;
      map.remove();
      mapRef.current = null;
      playerMarkerRef.current = null;
      taskMarkersLayerRef.current = null;
      offScreenLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update player marker & feed SmoothMapController when userLocation or testMode changes
  useEffect(() => {
    const map = mapRef.current;
    const ctrl = ctrlRef.current;
    if (!map || !ctrl) return;

    if (!userLocation) {
      if (playerMarkerRef.current) {
        playerMarkerRef.current.remove();
        playerMarkerRef.current = null;
      }
      return;
    }

    const effectiveAccuracy = testMode ? 0 : userAccuracy;
    const accepted = ctrl.updatePosition(
      userLocation.lat,
      userLocation.lng,
      effectiveAccuracy
    );
    const dampedPos = ctrl.getAcceptedPosition() ?? userLocation;

    if (!playerMarkerRef.current) {
      const pm = L.marker([dampedPos.lat, dampedPos.lng], {
        icon: testMode ? createDraggableTestIcon() : createPlayerDotIcon(),
        draggable: testMode,
        zIndexOffset: 1000,
        title: testMode ? 'Drag me to test!' : undefined
      }).addTo(map);

      pm.on('dragend', () => {
        const dragged = pm.getLatLng();
        latestPropsRef.current.onPlayerMove(dragged.lat, dragged.lng);
      });
      playerMarkerRef.current = pm;
    } else {
      if (accepted) {
        playerMarkerRef.current.setLatLng([dampedPos.lat, dampedPos.lng]);
        try { localStorage.setItem(LAST_KNOWN_KEY, JSON.stringify({ lat: dampedPos.lat, lng: dampedPos.lng })); } catch {}
      }
      playerMarkerRef.current.setIcon(
        testMode ? createDraggableTestIcon() : createPlayerDotIcon()
      );
      if (playerMarkerRef.current.dragging) {
        if (testMode) playerMarkerRef.current.dragging.enable();
        else playerMarkerRef.current.dragging.disable();
      }
    }

    updateOffScreenIndicators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng, userAccuracy, testMode]);

  // Render task markers & optionally fit bounds when fitToMarkers is enabled
  const markerSig = (taskMarkers || []).map((m) => `${m.lat},${m.lng}`).join('|');
  useEffect(() => {
    const map = mapRef.current;
    const taskLayer = taskMarkersLayerRef.current;
    if (!map || !taskLayer) return;

    taskLayer.clearLayers();
    (taskMarkers || []).forEach((m) => {
      if (typeof m?.lat !== 'number' || typeof m?.lng !== 'number') return;
      const leafletMarker = L.marker([m.lat, m.lng], {
        icon: createTaskMarkerIcon(m, showMarkerLabels)
      });
      leafletMarker.addTo(taskLayer);
    });

    if (fitToMarkers && !hasFittedRef.current) {
      const pts = (taskMarkers || [])
        .filter((m) => typeof m?.lat === 'number' && typeof m?.lng === 'number')
        .map((m) => L.latLng(m.lat, m.lng));
      if (userLocation) pts.push(L.latLng(userLocation.lat, userLocation.lng));
      if (pts.length >= 2) {
        const bounds = L.latLngBounds(pts);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
        hasFittedRef.current = true;
      } else if (pts.length === 1) {
        map.setView(pts[0], zoom);
        hasFittedRef.current = true;
      }
    }

    updateOffScreenIndicators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerSig, showMarkerLabels, fitToMarkers, Boolean(userLocation)]);

  // Recenter when recenterSignal increments (user tapped the right-hand centre-on-location button)
  useEffect(() => {
    if (!recenterSignal) return;
    const ctrl = ctrlRef.current;
    const map = mapRef.current;
    if (!ctrl || !map) return;
    const loc =
      ctrl.getAcceptedPosition() ||
      latestPropsRef.current.userLocation ||
      getInitialCenter();
    ctrl.recenterNow(loc.lat, loc.lng, latestPropsRef.current.zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal]);

  return (
    <div
      ref={wrapperRef}
      data-testid="rotating-task-map"
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        data-testid="rotating-task-map-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${PIVOT_HEIGHT_MULTIPLIER * 100}%`
        }}
      />
    </div>
  );
}
