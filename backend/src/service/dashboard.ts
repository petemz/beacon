import { prisma } from "@/lib/prisma"
import { ConflictError, NotFoundError } from "@/utils/error";
import { logger } from "@/utils/logger";

interface ParentsDTO {
    parentId: string
}

class Dashboard {

    //get the list of all children and additional info
    async getAllChildren(parentId: string) {
        const parent = await prisma.parent.findUnique({
            where: {id: parentId},
            select: {
                id: true,
                name: true,
                children: {
                    orderBy: {assignedIndex: "asc"},
                    select: {
                        id: true,
                        name: true,
                        bandId: true,
                        assignedIndex: true,
                        status: true,
                        lastSeenLandmark: true,
                        updatedAt: true
                    }
                }
            }
        });

        if (!parent) {
            logger.error("Parent does not exist");
            throw new NotFoundError("parent with user id does not exist")
        }

        return {
            data: parent,
            message: "Details successfully fetched"
        }
    }

    //parents taps mark as missing for a specific child
    async markChildAsMissing(parentId: string, childId: string) {

        const child = await prisma.child.findFirst({
            where: {id: childId, parentId},
            include: {
                parent: {
                    select: {phoneNumber: true, name: true}
                }
            }
        });


        if(!child) {
            logger.error("Child not found")
            throw new NotFoundError("Child not found")
        }

        if(child.status === "MISSING") {
            throw new ConflictError("child already marked as missing")
        }

        const latestEvent = await prisma.locationEvent.findFirst({where: {childId}, orderBy: {recordedAt: "desc"}});

        const landmark = latestEvent?.landmarkName ?? child.lastSeenLandmark ?? "unknown area";

        const minutesAgo = latestEvent ? Math.round((Date.now() - latestEvent.recordedAt.getTime()) / 60_000) : null;

        //flip child status to missing and snapshot landmark
        await prisma.child.update({
            where: {id: childId},
            data: {
                status: "MISSING",
                lastSeenLandmark: landmark
            }
        });

        return {
            message: `${child.name} has been marked as missing.`,
            childId,
            landmark,
        }
    }


    //confirm child has been found

    async markChildAsFounf(parentId: string, childId: string) {
        const child = await prisma.child.findFirst({where: {id: childId, parentId}});

        if(!child) {
            throw new NotFoundError("Child not found")
        }

        await prisma.child.update({
            where: {id: childId},
            data: {
                status: "RESOLVED"
            }
        });

        return {
            message: `${child.name} marked as found. Thank God!`, 
            childId 
        }
    } 

}

export const dashboard = new Dashboard()