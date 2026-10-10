declare module "geojson" {
  export type Geometry = any;
  export type FeatureCollection<G = any, P = any> = {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: G;
      properties: P;
    }>;
  };
}
