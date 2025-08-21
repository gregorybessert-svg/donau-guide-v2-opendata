import * as turf from "@turf/turf";
import { point, Position } from "@turf/helpers";

export function computeKm(
  donauLine: turf.Feature<turf.LineString>,
  user: Position
) {
  // Erstes und letztes Koordinatenpaar der Donau-Linie
  const start = point(donauLine.geometry.coordinates[0] as Position);
  const end = point(
    donauLine.geometry.coordinates[
      donauLine.geometry.coordinates.length - 1
    ] as Position
  );

  // Distanz entlang der Linie berechnen
  const line = turf.lineString(donauLine.geometry.coordinates);

  // Punkt des Users
  const userPoint = point(user);

  // Projektion: der Punkt des Users auf die Linie
  const snapped = turf.nearestPointOnLine(line, userPoint);

  // Länge entlang der Linie (von Start bis zur Projektion)
  const lineSlice = turf.lineSlice(start, snapped, line);
  const distKm = turf.length(lineSlice, { units: "kilometers" });

  return distKm; // 👈 gibt km zurück
}
