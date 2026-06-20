import { prisma } from "@/lib/prisma";
import { broadcastLocation } from "@/lib/ws";
import { NotFoundError } from "@/utils/error";
import { resolveLandmark } from "@/utils/geofence";


interface IngestDTO {
    deviceId: string;
    latitude: number;
    longitude: number;
    batteryLevel: number;
}

class Ingest {
    /**
        * POST /api/ingest/location
        * Called by the LoRa gateway (or SMS-parsing relay) when a child band pings.
        * This is the hot path — kept lean.
        *
        *Flow:
        *   1. Resolve band_id → child record
        *   2. Run geofence lookup → landmark name
        *   3. Write location_event
        *   4. Update child.lastSeenLandmark (denormalized fast-read cache)
        *   5. Broadcast to any connected WebSocket clients (live map)
    */
    async bandPing(data: IngestDTO) {
        const {deviceId, latitude, longitude, batteryLevel} = data;

        const child = await prisma.child.findUnique({
            where: {bandId: deviceId},
            select: {id: true, name: true, status: true}
        });

        if(!child) {
            throw new NotFoundError("child with that bandId does not exist")
        }

        const landmarkName = resolveLandmark(latitude, longitude);

        // Write event + update denormalized landmark in one transaction

        const [event] = await prisma.$transaction([
            prisma.locationEvent.create({
                data: {
                    childId: child.id,
                    latitude,
                    longitude,
                    landmarkName,
                    batteryLevel: batteryLevel ?? null
                }
            }),
            prisma.child.update({
                where: {id: child.id},
                data: {
                    lastSeenLandmark: landmarkName
                }
            })
        ]);


        //push to any live-map websocket clients watching this child
        broadcastLocation(child.id, {
            latitude,
            longitude,
            landmarkName,
            batteryLevel: event.batteryLevel ?? null,
            recordedAt: event.recordedAt,
        });

        return {
            received: true,
            known: true,
            landmark: landmarkName
        }
    }



    /**
        * GET /api/ingest/latest/:childId
        * Returns the most recent location event for a child.
        * Used by the live-map page on initial load before WS kicks in.
    */
   async getChildLocationForLiveMap(childId: string) {
    const event = await prisma.locationEvent.findFirst({
        where:{childId},
        orderBy: {recordedAt: "desc"}
    });

    if(!event) {
        throw new NotFoundError("No location data yet");
    }

    return event
   }
}

export const ingest = new Ingest();