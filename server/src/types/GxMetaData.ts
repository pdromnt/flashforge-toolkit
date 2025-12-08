export type GxMetaData = {
    printTime: number; // seconds
    filamentUsage: number; // mm
    filamentUsageLeft: number; // mm
    multiExtruderType: number;
    layerHeight: number;
    shells: number;
    printSpeed: number; // mm/s
    bedTemperature: number;
    printTemperature: number; // right extruder
    printTemperatureLeft: number; // left extruder
}

export interface GxHeader extends GxMetaData {
    version: string;
    bitmapStart: number;
    gcodeStart: number;
}