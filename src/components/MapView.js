import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  useWindowDimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Line, Rect, G } from 'react-native-svg';
import { MapPin } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { MemberMarker } from './MemberMarker';
import { ClusterMarker } from './ClusterMarker';
import { MeetingPointMarker } from './MeetingPointMarker';
import { MapControls } from './MapControls';
import { calculateDistanceMeters, formatDistance, calculateGroupCenter } from '../utils/distance';
import { mapService, MAP_STYLES } from '../services/mapService';

export const MapView = ({
  userLocation,
  members = [],
  clusters = [],
  meetingPoints = [],
  selectedMember = null,
  selectedMeetingPoint = null,
  onSelectMember,
  onSelectCluster,
  onSelectMeetingPoint,
  showClusters = true,
  showMeetingPoints = true,
  showRoute = false,
  routeDestination = null,
  center = null,
  zoom = 16,
  height = 360,
  interactive = true,
  providerBadgeTop = 14,
  controlsBottomOffset = 24,
  isPinDropMode = false,
  onCameraChange = null,
  style,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Dynamic layout measurements
  const initialWidth = Math.min(windowWidth, 460);
  const initialHeight =
    typeof height === 'number'
      ? height
      : height === '100%'
      ? windowHeight
      : Math.min(windowHeight * 0.45, 360);

  const [layoutSize, setLayoutSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });

  const onLayout = (e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setLayoutSize({ width: w, height: h });
    }
  };

  const containerWidth = layoutSize.width;
  const containerHeight = layoutSize.height;
  const isCompact = typeof height === 'number' && height <= 320;

  // Oversized tile buffer to completely prevent dark edges during panning
  const BUFFER = 180;
  const tileWidth = Math.min(1280, Math.round(containerWidth + BUFFER * 2));
  const tileHeight = Math.min(1280, Math.round(containerHeight + BUFFER * 2));

  // Active geographic center & zoom
  const getInitialCoord = () => {
    if (center && !isNaN(center.latitude) && !isNaN(center.longitude)) return center;
    if (userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) return userLocation;
    const memberWithCoords = (members || []).find(
      (m) => m.coordinates && !isNaN(m.coordinates.latitude) && !isNaN(m.coordinates.longitude)
    );
    if (memberWithCoords) return memberWithCoords.coordinates;
    return { latitude: 20.5937, longitude: 78.9629 };
  };

  const [mapCenterCoord, setMapCenterCoord] = useState(getInitialCoord);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [showPointsToggle, setShowPointsToggle] = useState(showMeetingPoints);
  const hasInitiallyCenteredRef = useRef(false);

  // Mutable ref so PanResponder never reads stale closure variables
  const stateRef = useRef({
    mapCenterCoord,
    currentZoom,
    containerWidth,
    containerHeight,
    mapOffset,
  });

  useEffect(() => {
    stateRef.current = {
      mapCenterCoord,
      currentZoom,
      containerWidth,
      containerHeight,
      mapOffset,
    };
  });

  // Auto-center on userLocation as soon as GPS arrives if center wasn't explicitly given
  useEffect(() => {
    if (userLocation && !center && !hasInitiallyCenteredRef.current) {
      if (!isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
        setMapCenterCoord({ ...userLocation });
        setMapOffset({ x: 0, y: 0 });
        hasInitiallyCenteredRef.current = true;
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude, center]);

  // Mapbox style & loading states
  const [activeStyle, setActiveStyle] = useState(mapService.getStyle() || 'streets-v12');
  const [mapboxError, setMapboxError] = useState(false);
  const [isTileLoading, setIsTileLoading] = useState(false);

  // Keep center synchronized if center prop changes externally
  useEffect(() => {
    if (center && (center.latitude !== mapCenterCoord.latitude || center.longitude !== mapCenterCoord.longitude)) {
      setMapCenterCoord(center);
      setMapOffset({ x: 0, y: 0 });
    }
  }, [center?.latitude, center?.longitude]);

  // Check if Mapbox is configured
  const isMapbox = mapService.isMapboxConfigured() && !mapboxError;

  // DOUBLE-BUFFERED TILE MANAGEMENT (ZERO BLACK FLASHES)
  // displayedTile: The stable, fully decoded tile currently visible
  // pendingTile: The incoming tile downloading in the background
  const [displayedTile, setDisplayedTile] = useState(() => {
    const initCoord = getInitialCoord();
    const url = isMapbox
      ? mapService.getStaticMapUrl({
          latitude: initCoord.latitude,
          longitude: initCoord.longitude,
          zoom: currentZoom,
          width: tileWidth,
          height: tileHeight,
          style: activeStyle,
        })
      : null;
    return {
      url,
      coord: initCoord,
      zoom: currentZoom,
      style: activeStyle,
    };
  });

  const [pendingTile, setPendingTile] = useState(null);

  // Desired static URL for current camera state
  const targetTileUrl = isMapbox
    ? mapService.getStaticMapUrl({
        latitude: mapCenterCoord.latitude,
        longitude: mapCenterCoord.longitude,
        zoom: currentZoom,
        width: tileWidth,
        height: tileHeight,
        style: activeStyle,
      })
    : null;

  // Whenever targetTileUrl changes, initiate background load without clearing displayedTile
  useEffect(() => {
    if (!targetTileUrl) return;
    if (targetTileUrl === displayedTile?.url) return;

    setPendingTile({
      url: targetTileUrl,
      coord: { ...mapCenterCoord },
      zoom: currentZoom,
      style: activeStyle,
    });
  }, [targetTileUrl, displayedTile?.url]);

  // Initialize displayedTile if initially empty
  useEffect(() => {
    if (!displayedTile?.url && targetTileUrl) {
      setDisplayedTile({
        url: targetTileUrl,
        coord: { ...mapCenterCoord },
        zoom: currentZoom,
        style: activeStyle,
      });
    }
  }, [targetTileUrl, displayedTile?.url]);

  // Project geographic coordinate to viewport screen position
  const projectToScreen = (coord) => {
    if (!coord || isNaN(coord.latitude) || isNaN(coord.longitude)) {
      return { x: containerWidth / 2, y: containerHeight / 2 };
    }
    const pt = mapService.project(coord, mapCenterCoord, currentZoom, containerWidth, containerHeight);
    return {
      x: pt.x + mapOffset.x,
      y: pt.y + mapOffset.y,
    };
  };

  // Screen transform for any tile based on its geographic center
  const getTileTransform = (tileCoord) => {
    if (!tileCoord || isNaN(tileCoord.latitude) || isNaN(tileCoord.longitude)) {
      return [{ translateX: mapOffset.x }, { translateY: mapOffset.y }];
    }
    const pt = projectToScreen(tileCoord);
    return [
      { translateX: pt.x - containerWidth / 2 },
      { translateY: pt.y - containerHeight / 2 },
    ];
  };

  // Camera change notification: only fired on stable coordinate changes (release or programmatically), NEVER on per-pixel drag
  useEffect(() => {
    if (onCameraChange && mapCenterCoord) {
      onCameraChange(mapCenterCoord);
    }
  }, [mapCenterCoord.latitude, mapCenterCoord.longitude]);

  // Pan Responder with drag update and release centering using fresh stateRef
  const panStartRef = useRef({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        interactive && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onPanResponderGrant: () => {
        panStartRef.current = { ...stateRef.current.mapOffset };
      },
      onPanResponderMove: (_, gesture) => {
        setMapOffset({
          x: panStartRef.current.x + gesture.dx,
          y: panStartRef.current.y + gesture.dy,
        });
      },
      onPanResponderRelease: (_, gesture) => {
        const dist = Math.hypot(gesture.dx, gesture.dy);
        if (dist > 8) {
          const {
            mapCenterCoord: curCenter,
            currentZoom: curZoom,
            containerWidth: curW,
            containerHeight: curH,
          } = stateRef.current;
          const totalDx = panStartRef.current.x + gesture.dx;
          const totalDy = panStartRef.current.y + gesture.dy;
          const newCenter = mapService.unproject(
            {
              x: curW / 2 - totalDx,
              y: curH / 2 - totalDy,
            },
            curCenter,
            curZoom,
            curW,
            curH
          );
          setMapCenterCoord(newCenter);
          setMapOffset({ x: 0, y: 0 });
          if (onCameraChange) {
            onCameraChange(newCenter);
          }
        }
      },
    })
  ).current;

  // Map Controls handlers
  const handleZoomIn = () => setCurrentZoom((z) => Math.min(Number((z + 0.75).toFixed(2)), 19));
  const handleZoomOut = () => setCurrentZoom((z) => Math.max(Number((z - 0.75).toFixed(2)), 12));
  const handleRecenter = () => {
    if (userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
      setMapCenterCoord({ ...userLocation });
      setMapOffset({ x: 0, y: 0 });
      setCurrentZoom(16.5);
    } else if (center) {
      setMapCenterCoord({ ...center });
      setMapOffset({ x: 0, y: 0 });
      setCurrentZoom(16.5);
    }
  };
  const handleFitGroup = () => {
    const allCoords = [];
    if (userLocation && !isNaN(userLocation.latitude)) {
      allCoords.push(userLocation);
    }
    (members || []).forEach((m) => {
      if (m.coordinates && !isNaN(m.coordinates.latitude) && !isNaN(m.coordinates.longitude)) {
        allCoords.push(m.coordinates);
      }
    });

    if (allCoords.length > 1) {
      const groupCenter = calculateGroupCenter(allCoords);
      if (groupCenter) {
        setMapCenterCoord(groupCenter);
        setMapOffset({ x: 0, y: 0 });
        setCurrentZoom(14.8);
      }
    } else if (allCoords.length === 1) {
      setMapCenterCoord({ ...allCoords[0] });
      setMapOffset({ x: 0, y: 0 });
      setCurrentZoom(16.5);
    }
  };

  // Cycle through available Mapbox styles
  const handleCycleStyle = () => {
    const styles = mapService.getStyles();
    const currentIndex = styles.findIndex((s) => s.id === activeStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length].id;
    setActiveStyle(nextStyle);
    mapService.setStyle(nextStyle);
    setMapboxError(false);
  };

  // User projected screen coordinate
  const userPos = projectToScreen(userLocation);

  // Dynamic accuracy radius in screen pixels based on Web Mercator scale
  const accuracyRadius = userLocation?.accuracy
    ? Math.max(
        18,
        Math.min(
          95,
          Math.round(
            userLocation.accuracy /
              ((78271.51696 * Math.cos(((userLocation.latitude || 20) * Math.PI) / 180)) /
                Math.pow(2, currentZoom))
          )
        )
      )
    : 32;

  // Route destination coordinate
  const routePos = routeDestination ? projectToScreen(routeDestination.coordinates) : null;
  const routeDistance =
    userLocation && routeDestination?.coordinates
      ? calculateDistanceMeters(userLocation, routeDestination.coordinates)
      : null;

  const numCols = Math.ceil(containerWidth / 35) + 1;
  const numRows = Math.ceil(containerHeight / 35) + 1;

  const currentStyleObj = MAP_STYLES.find((s) => s.id === activeStyle) || MAP_STYLES[0];

  return (
    <View
      style={[
        styles.container,
        typeof height === 'number' ? { height } : { flex: 1 },
        style,
      ]}
      onLayout={onLayout}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      {/* 1. REAL MAPBOX LAYER */}
      {isMapbox && (displayedTile?.url || pendingTile?.url) ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerWidth || '100%',
            height: containerHeight || '100%',
            overflow: 'hidden',
          }}
          pointerEvents="none"
        >
          {/* DISPLAYED TILE (Keeps showing smoothly during any pan or network load) */}
          {displayedTile?.url ? (
            <Image
              key={`disp-${displayedTile.url}`}
              source={{ uri: displayedTile.url }}
              style={{
                width: tileWidth,
                height: tileHeight,
                position: 'absolute',
                top: -BUFFER,
                left: -BUFFER,
                transform: getTileTransform(displayedTile.coord),
              }}
              resizeMode="cover"
            />
          ) : null}

          {/* PENDING TILE (Loads in background; seamlessly promotes to displayedTile on load) */}
          {pendingTile?.url && pendingTile.url !== displayedTile?.url ? (
            <Image
              key={`pend-${pendingTile.url}`}
              source={{ uri: pendingTile.url }}
              style={{
                width: tileWidth,
                height: tileHeight,
                position: 'absolute',
                top: -BUFFER,
                left: -BUFFER,
                transform: getTileTransform(pendingTile.coord),
                opacity: 0.01,
              }}
              resizeMode="cover"
              onLoadStart={() => setIsTileLoading(true)}
              onLoadEnd={() => setIsTileLoading(false)}
              onLoad={() => {
                setDisplayedTile(pendingTile);
                setPendingTile(null);
                setIsTileLoading(false);
              }}
              onError={(e) => {
                console.warn('Mapbox tile load warning:', e.nativeEvent?.error);
                setPendingTile(null);
                setIsTileLoading(false);
              }}
            />
          ) : null}

          {/* Subtle tint according to active style */}
          {activeStyle === 'dark-v11' ? (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.25)' }]} />
          ) : activeStyle === 'satellite-streets-v12' ? (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.15)' }]} />
          ) : null}
        </View>
      ) : null}

      {/* 2. VECTOR BASE FALLBACK (when Mapbox is offline or disabled) */}
      {(!isMapbox || (!displayedTile?.url && !pendingTile?.url)) && (
        <Svg
          width={containerWidth}
          height={containerHeight}
          style={StyleSheet.absoluteFillObject}
        >
          <Rect width={containerWidth} height={containerHeight} fill="#0F172A" />
          <G stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
            {Array.from({ length: numRows }).map((_, i) => (
              <Line
                key={`h-${i}`}
                x1="0"
                y1={i * 35}
                x2={containerWidth}
                y2={i * 35}
              />
            ))}
            {Array.from({ length: numCols }).map((_, i) => (
              <Line
                key={`v-${i}`}
                x1={i * 35}
                y1="0"
                x2={i * 35}
                y2={containerHeight}
              />
            ))}
          </G>
        </Svg>
      )}

      {/* 3. RADAR & ROUTE SVG OVERLAY LAYER */}
      <Svg
        width={containerWidth}
        height={containerHeight}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        {/* Radar & Accuracy SVG ring around real user location */}
        {userLocation && !isNaN(userLocation.latitude) && (
          <G>
            {/* Real GPS accuracy circle */}
            <Circle
              cx={userPos.x}
              cy={userPos.y}
              r={accuracyRadius}
              fill="rgba(56, 189, 248, 0.10)"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Inner pulse ring */}
            <Circle
              cx={userPos.x}
              cy={userPos.y}
              r={22}
              fill="none"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="1.5"
            />
          </G>
        )}

        {/* Route Line if navigation is active */}
        {showRoute && routePos && (
          <G>
            <Line
              x1={userPos.x}
              y1={userPos.y}
              x2={routePos.x}
              y2={routePos.y}
              stroke="#0284C7"
              strokeWidth="4"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            <Circle
              cx={routePos.x}
              cy={routePos.y}
              r={16}
              fill="rgba(2, 132, 199, 0.28)"
            />
          </G>
        )}
      </Svg>

      {/* 4. MAPBOX PROVIDER & STYLE BADGE (Interactive) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={isMapbox ? handleCycleStyle : null}
        style={[styles.providerBadge, { top: providerBadgeTop }]}
      >
        <View style={[styles.providerDot, !isMapbox && { backgroundColor: '#F59E0B' }]} />
        <Text style={styles.providerText}>
          {isMapbox ? `Mapbox ${currentStyleObj.name} ▾` : 'MyCrew Vector Engine'}
        </Text>
        {isTileLoading && (
          <ActivityIndicator size="small" color="#94A3B8" style={{ marginLeft: 6 }} />
        )}
      </TouchableOpacity>

      {/* 5. MEETING POINTS LAYER */}
      {showPointsToggle &&
        meetingPoints.map((mp) => {
          if (!mp.coordinates || isNaN(mp.coordinates.latitude)) return null;
          const pos = projectToScreen(mp.coordinates);
          return (
            <View
              key={mp.id}
              style={[
                styles.markerPosition,
                { left: pos.x - 40, top: pos.y - 50 },
              ]}
            >
              <MeetingPointMarker
                meetingPoint={mp}
                isSelected={selectedMeetingPoint?.id === mp.id}
                onPress={onSelectMeetingPoint}
              />
            </View>
          );
        })}

      {/* 6. CLUSTER MARKERS LAYER */}
      {showClusters &&
        clusters.map((cluster) => {
          if (cluster.count <= 1) return null;
          const clusterCoord = cluster.center || cluster.coordinates;
          if (!clusterCoord || isNaN(clusterCoord.latitude) || isNaN(clusterCoord.longitude)) {
            return null;
          }
          const pos = projectToScreen(clusterCoord);
          return (
            <View
              key={cluster.id}
              style={[
                styles.markerPosition,
                { left: pos.x - 35, top: pos.y - 45 },
              ]}
            >
              <ClusterMarker
                cluster={cluster}
                count={cluster.count}
                name={cluster.name}
                onPress={onSelectCluster}
              />
            </View>
          );
        })}

      {/* 7. MEMBER MARKERS LAYER */}
      {!showClusters &&
        members.map((member) => {
          if (
            !member.coordinates ||
            isNaN(member.coordinates.latitude) ||
            isNaN(member.coordinates.longitude) ||
            member.coordinates.latitude === 0
          ) {
            return null;
          }
          const pos = projectToScreen(member.coordinates);
          return (
            <View
              key={member.id}
              style={[
                styles.markerPosition,
                { left: pos.x - 30, top: pos.y - 35 },
              ]}
            >
              <MemberMarker
                member={member}
                isSelected={selectedMember?.id === member.id}
                onPress={onSelectMember}
              />
            </View>
          );
        })}

      {/* 8. CURRENT USER MARKER */}
      {userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude) && (
        <View
          style={[
            styles.markerPosition,
            { left: userPos.x - 30, top: userPos.y - 35 },
          ]}
        >
          <MemberMarker
            member={{
              name: 'YOU',
              status: 'live',
              coordinates: userLocation,
            }}
            isUser={true}
          />
        </View>
      )}

      {/* 9. DISTANCE CALLOUT ON ROUTE */}
      {showRoute && routeDistance !== null && routePos && (
        <View
          style={[
            styles.routeBadge,
            {
              left: Math.max(10, Math.min(containerWidth - 90, (userPos.x + routePos.x) / 2 - 38)),
              top: Math.max(20, Math.min(containerHeight - 40, (userPos.y + routePos.y) / 2 - 16)),
            },
          ]}
        >
          <Text style={styles.routeBadgeText}>{formatDistance(routeDistance)}</Text>
        </View>
      )}

      {/* 10. FINDING LOCATION BADGE */}
      {!userLocation && interactive && (
        <View style={styles.findingLocationPill}>
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.findingLocationText}>Finding your location…</Text>
        </View>
      )}

      {/* 11. PIN PLACEMENT MODE CENTER TARGET PIN */}
      {isPinDropMode && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: containerHeight / 2 - 46,
            left: containerWidth / 2 - 20,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
        >
          <View style={styles.pinDropBubble}>
            <Text style={styles.pinDropBubbleText}>Drag map to position pin</Text>
          </View>
          <View style={styles.pinDropIconWrap}>
            <MapPin size={40} color="#EF4444" fill="#EF4444" strokeWidth={1.5} />
          </View>
          <View style={styles.pinGroundPulse} />
        </View>
      )}

      {/* 12. MAPBOX & OSM ATTRIBUTION */}
      <View style={styles.attributionContainer} pointerEvents="none">
        <Text style={styles.attributionText}>© Mapbox © OpenStreetMap</Text>
      </View>

      {/* 12. INTERACTIVE MAP CONTROLS */}
      {interactive && (
        <MapControls
          onRecenter={handleRecenter}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitGroup={handleFitGroup}
          onToggleMeetingPoints={() => setShowPointsToggle((prev) => !prev)}
          isMeetingPointsActive={showPointsToggle}
          bottomOffset={controlsBottomOffset}
          compact={isCompact}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  markerPosition: {
    position: 'absolute',
    zIndex: 5,
  },
  providerBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 6,
  },
  providerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  providerText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  routeBadge: {
    position: 'absolute',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    zIndex: 6,
  },
  routeBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 11,
  },
  findingLocationPill: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    zIndex: 7,
    ...SHADOWS.md,
  },
  findingLocationText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 4,
  },
  attributionText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '500',
  },
  pinDropBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 4,
    ...SHADOWS.md,
  },
  pinDropBubbleText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pinDropIconWrap: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  pinGroundPulse: {
    width: 14,
    height: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginTop: -2,
  },
});
