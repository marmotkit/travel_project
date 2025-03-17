declare module 'react-simple-maps' {
  import React from 'react';
  
  export interface GeographyProps {
    geography: any;
    key?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: any;
      hover?: any;
      pressed?: any;
    };
  }
  
  export interface ComposableMapProps {
    projectionConfig?: any;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }
  
  export interface GeographiesProps {
    geography: any;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }
  
  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
  }
  
  export interface MarkerProps {
    coordinates: [number, number];
    key?: string;
    children?: React.ReactNode;
  }
  
  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Marker: React.FC<MarkerProps>;
} 