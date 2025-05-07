"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Globe2, Ruler, DollarSign, Briefcase, ZoomIn, ZoomOut, Target } from "lucide-react";

// Add marker cluster CSS
const markerClusterStyles = `
  .marker-cluster-small {
    background-color: rgba(181, 226, 140, 0.6);
  }
  .marker-cluster-small div {
    background-color: rgba(110, 204, 57, 0.6);
  }
  .marker-cluster-medium {
    background-color: rgba(241, 211, 87, 0.6);
  }
  .marker-cluster-medium div {
    background-color: rgba(240, 194, 12, 0.6);
  }
  .marker-cluster-large {
    background-color: rgba(253, 156, 115, 0.6);
  }
  .marker-cluster-large div {
    background-color: rgba(241, 128, 23, 0.6);
  }
  .marker-cluster {
    background-clip: padding-box;
    border-radius: 20px;
  }
  .marker-cluster div {
    width: 30px;
    height: 30px;
    margin-left: 5px;
    margin-top: 5px;
    text-align: center;
    border-radius: 15px;
    font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
    color: white;
  }
  .marker-cluster span {
    line-height: 30px;
  }
`;

// Add type definitions for marker cluster
declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    chunkedLoading?: boolean;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    iconCreateFunction?: (cluster: { getChildCount: () => number }) => L.DivIcon;
  }

  class MarkerClusterGroup extends L.Layer {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
  }

  namespace MarkerClusterGroup {
    function extend(options: any): any;
  }
}

// Fix for default marker icons
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  });
};

interface Opportunity {
  id: string;
  position: string;
  company?: string | { name: string; _id: string; logo?: string; industry?: string; location?: string };
  location: string;
  coordinates: { lat: number; lng: number } | null;
  salary: string;
  type: string;
  distance?: number;
  skills: string[];
  isRemote?: boolean;
  description?: string;
}

interface MapProps {
  opportunities: Opportunity[];
  selectedLocation: { lat: number; lng: number } | null;
  onMarkerClick?: (opportunity: Opportunity) => void;
}

export default function Map({ opportunities, selectedLocation, onMarkerClick }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Kurdistan region bounds
  const kurdistanBounds = L.latLngBounds(
    [34.5, 41.5], // Southwest corner
    [38.5, 46.5]  // Northeast corner
  );

  useEffect(() => {
    if (mapRef.current) return;

    // Initialize map
    mapRef.current = L.map('map', {
      minZoom: 7,
      maxZoom: 15,
      zoomControl: false
    }).setView([36.1901, 44.0091], zoomLevel);

    // Add zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapRef.current);

    // Add scale control
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(mapRef.current);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Initialize marker cluster group
    const clusterGroup = new L.MarkerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-marker">${count}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(40, 40)
        });
      }
    });

    clusterRef.current = clusterGroup;
    mapRef.current.addLayer(clusterGroup);

    // Add Kurdistan region bounds
    L.rectangle(kurdistanBounds, {
      color: "#6930c3",
      weight: 2,
      fillOpacity: 0.1,
      fillColor: "#6930c3"
    }).addTo(mapRef.current);

    // Handle zoom changes
    mapRef.current.on('zoomend', () => {
      if (mapRef.current) {
        setZoomLevel(mapRef.current.getZoom());
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add effect to handle selected location changes
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;

    // Remove previous selected marker if exists
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
    }

    // Create new selected marker
    const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
      icon: L.divIcon({
        className: 'selected-location-marker',
        html: '<div class="selected-location-dot"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    });

    // Add marker to map
    marker.addTo(mapRef.current);
    selectedMarkerRef.current = marker;

    // Zoom in when showing details
    setIsDetailOpen(true);
    mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 14);

    // Add popup to selected marker
    const selectedOpportunity = opportunities.find(
      opp => opp.coordinates?.lat === selectedLocation.lat && opp.coordinates?.lng === selectedLocation.lng
    );

    if (selectedOpportunity) {
      const popup = marker.bindPopup(`
        <div class="opportunity-popup">
          <h3>${selectedOpportunity.position}</h3>
          ${selectedOpportunity.company ? `<p><strong>Company:</strong> ${typeof selectedOpportunity.company === 'string' ? selectedOpportunity.company : selectedOpportunity.company.name}</p>` : ''}
          <p><strong>Location:</strong> ${selectedOpportunity.location}</p>
          ${selectedOpportunity.isRemote ? '<p class="remote-badge">Remote Position</p>' : ''}
          ${selectedOpportunity.distance ? `<p><strong>Distance:</strong> ${selectedOpportunity.distance.toFixed(1)} km</p>` : ''}
          <p><strong>Salary:</strong> ${selectedOpportunity.salary}</p>
          <p><strong>Type:</strong> ${selectedOpportunity.type}</p>
          ${selectedOpportunity.skills && selectedOpportunity.skills.length > 0 ? `
            <div class="skills-section">
              <strong>Required Skills:</strong>
              <div class="skills-list">
                ${selectedOpportunity.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          ${selectedOpportunity.description ? `<p class="description">${selectedOpportunity.description}</p>` : ''}
        </div>
      `);

      // Handle popup open/close events
      popup.on('add', () => {
        setIsDetailOpen(true);
        if (selectedOpportunity.coordinates) {
          mapRef.current?.setView([selectedOpportunity.coordinates.lat, selectedOpportunity.coordinates.lng], 14);
        }
      });

      popup.on('remove', () => {
        setIsDetailOpen(false);
        // Zoom out to show all markers
        const bounds = L.latLngBounds(opportunities
          .filter(o => o.coordinates)
          .map(o => [o.coordinates!.lat, o.coordinates!.lng] as [number, number]));
        
        if (bounds.isValid()) {
          mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
        }
      });

      popup.openPopup();
    }

    return () => {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
        selectedMarkerRef.current = null;
      }
    };
  }, [selectedLocation, opportunities]);

  useEffect(() => {
    if (!mapRef.current || !opportunities.length) return;

    // Clear existing markers
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
    }

    // Create a new marker cluster group
    const clusterGroup = new L.MarkerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-marker">${count}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(40, 40)
        });
      }
    });

    clusterRef.current = clusterGroup;

    // Group opportunities by location
    const opportunitiesByLocation = opportunities.reduce((acc, opportunity) => {
      if (opportunity.coordinates) {
        const key = `${opportunity.coordinates.lat},${opportunity.coordinates.lng}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(opportunity);
      }
      return acc;
    }, {} as Record<string, Opportunity[]>);

    // Add markers for each location
    Object.entries(opportunitiesByLocation).forEach(([locationKey, locationOpportunities]) => {
      const [lat, lng] = locationKey.split(',').map(Number);
      const opportunityCount = locationOpportunities.length;
      
      // Create marker with different styles based on opportunity count
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: `custom-marker ${opportunityCount === 1 ? 'single' : opportunityCount === 2 ? 'double' : 'multiple'}`,
          html: `
            <div class="marker-content">
              <div class="marker-icon ${opportunityCount === 1 ? 'single' : opportunityCount === 2 ? 'double' : 'multiple'}">
                ${opportunityCount === 1 ? 
                  '<i class="fas fa-building"></i>' : 
                  opportunityCount === 2 ? 
                  '<i class="fas fa-building"></i><i class="fas fa-building"></i>' :
                  `<span class="marker-count">${opportunityCount}</span>`
                }
              </div>
              <div class="marker-label">${locationOpportunities[0].location}</div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })
      });

      // Create popup content based on number of opportunities
      const popupContent = opportunityCount === 1 ? `
        <div class="opportunity-popup">
          <h3>${locationOpportunities[0].position}</h3>
          ${locationOpportunities[0].company ? `<p><strong>Company:</strong> ${typeof locationOpportunities[0].company === 'string' ? locationOpportunities[0].company : locationOpportunities[0].company.name}</p>` : ''}
          <p><strong>Location:</strong> ${locationOpportunities[0].location}</p>
          ${locationOpportunities[0].isRemote ? '<p class="remote-badge">Remote Position</p>' : ''}
          ${locationOpportunities[0].distance ? `<p><strong>Distance:</strong> ${locationOpportunities[0].distance.toFixed(1)} km</p>` : ''}
          <p><strong>Salary:</strong> ${locationOpportunities[0].salary}</p>
          <p><strong>Type:</strong> ${locationOpportunities[0].type}</p>
          ${locationOpportunities[0].skills && locationOpportunities[0].skills.length > 0 ? `
            <div class="skills-section">
              <strong>Required Skills:</strong>
              <div class="skills-list">
                ${locationOpportunities[0].skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          ${locationOpportunities[0].description ? `<p class="description">${locationOpportunities[0].description}</p>` : ''}
        </div>
      ` : `
        <div class="opportunity-popup">
          <h3>${opportunityCount} Opportunities in ${locationOpportunities[0].location}</h3>
          <div class="opportunities-list">
            ${locationOpportunities.map(opp => `
              <div class="opportunity-item">
                <h4>${opp.position}</h4>
                ${opp.company ? `<p><strong>Company:</strong> ${typeof opp.company === 'string' ? opp.company : opp.company.name}</p>` : ''}
                <p><strong>Salary:</strong> ${opp.salary}</p>
                <p><strong>Type:</strong> ${opp.type}</p>
                ${opp.isRemote ? '<p class="remote-badge">Remote Position</p>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const popup = marker.bindPopup(popupContent);

      // Handle popup open/close events
      popup.on('add', () => {
        setIsDetailOpen(true);
        mapRef.current?.setView([lat, lng], 14);
      });

      popup.on('remove', () => {
        setIsDetailOpen(false);
        // Zoom out to show all markers
        const bounds = L.latLngBounds(opportunities
          .filter(o => o.coordinates)
          .map(o => [o.coordinates!.lat, o.coordinates!.lng] as [number, number]));
        
        if (bounds.isValid()) {
          mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
        }
      });

      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(locationOpportunities[0]);
        }
      });

      clusterGroup.addLayer(marker);
    });

    // Add the cluster group to the map
    mapRef.current.addLayer(clusterGroup);

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(opportunities
      .filter(o => o.coordinates)
      .map(o => [o.coordinates!.lat, o.coordinates!.lng] as [number, number]));
    
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [opportunities, onMarkerClick]);

  return (
    <>
      <style jsx global>{markerClusterStyles}</style>
      <div id="map" style={{ height: '100%', width: '100%' }}></div>
      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
        }

        .marker-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .marker-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .marker-icon.single {
          background: #6930c3;
        }

        .marker-icon.double {
          background: #5e60ce;
          position: relative;
        }

        .marker-icon.double i:first-child {
          position: absolute;
          left: 8px;
          transform: scale(0.8);
        }

        .marker-icon.double i:last-child {
          position: absolute;
          right: 8px;
          transform: scale(0.8);
        }

        .marker-icon.multiple {
          background: #4cc9f0;
        }

        .marker-count {
          font-weight: bold;
          font-size: 16px;
        }

        .marker-label {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .marker-content:hover .marker-label {
          opacity: 1;
        }

        .marker-content:hover .marker-icon {
          transform: scale(1.1);
        }

        .selected-location-marker {
          background: none;
          border: none;
        }

        .selected-location-dot {
          width: 12px;
          height: 12px;
          background: #ff4444;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .opportunity-popup {
          padding: 12px;
          max-width: 300px;
        }

        .opportunity-popup h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2d3748;
        }

        .opportunity-popup p {
          margin: 4px 0;
          font-size: 14px;
          color: #4a5568;
        }

        .remote-badge {
          display: inline-block;
          background: #ebf8ff;
          color: #2b6cb0;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 4px 0;
        }

        .skills-section {
          margin-top: 8px;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }

        .skill-tag {
          background: #edf2f7;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .description {
          margin-top: 8px;
          font-size: 13px;
          color: #718096;
          line-height: 1.4;
        }

        .custom-cluster {
          background: none;
          border: none;
        }

        .cluster-marker {
          width: 40px;
          height: 40px;
          background: #6930c3;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .leaflet-popup-tip {
          background: white;
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }

        .leaflet-control-zoom a {
          background: white !important;
          color: #4a5568 !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
        }

        .leaflet-control-zoom a:hover {
          background: #f7fafc !important;
          color: #2d3748 !important;
        }

        .leaflet-control-scale {
          border: none !important;
          background: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </>
  );
} 