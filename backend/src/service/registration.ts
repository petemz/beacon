import { prisma } from "@/lib/prisma";
import { ConflictError } from "@/utils/error";
import { logger } from "@/utils/logger";



interface Child {
    name: string;
    bandId: string;
}

interface ParentsDTO {
    name: string;
    phoneNumber: string;
    children: Child[];
}

class Registeration {
    registerParent = async(data: ParentsDTO) => {
        const {name, phoneNumber, children} = data
    
        const existing = await prisma.parent.findUnique({
            where: {phoneNumber}
        });
    
        if (existing) {
            logger.error("Phone number already exists")
            throw new ConflictError("This phone number already exists")
        }
    
        /*
        FOR THE SAKE OF DEMO I WILL BE SKIPPING ALL THIS CHECK
        should check for duplicate child Id in this batch.. but since it is a demo.. skipping that
        additionally should check if another child with another parent already have that band id assigned to them 
        */
    
        const parent = await prisma.parent.create({
            data: {
                name: name,
                phoneNumber: phoneNumber, 
                children: {
                    create: children.map((child: {name: string, bandId: string}, index: number) => ({
                            name: child.name,
                            bandId: child.bandId,
                            assignedIndex: index + 1
                        })),
                    },
                },
                include: {children: true}
        });
    
    
        return {
            message: "Family registered successfully",
            data: {
                parent: parent.name,
                parentId: parent.id,
                children: parent.children.map((c: {id: string, name: string, bandId: string, assignedIndex: number}) => ({
                    id: c.id,
                    name: c.name,
                    bandId: c.bandId,
                    assignedIndex: c.bandId
                }))
            }
        }
    }
    
}



export const registeration = new Registeration();