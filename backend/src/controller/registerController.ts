import {z} from "zod";
import {Request, Response} from "express"
import { ValidationError, InternalError } from "@/utils/error";
import { registeration } from "@/service/registration";
import { logger } from "@/utils/logger";

const childInput = z.object({
    name: z.string().min(1).max(100),
    bandId: z.string().min(3).max(100)
})

const RegisterSchema = z.object({
    name: z.string().min(1).max(100),
    phoneNumber: z.string().min(10).max(20),
    children: z.array(childInput).min(1).max(20)
})

class RegisterationController {
    //called by the volunteer at the admin booth
    registerUser = async(_req: Request, _res: Response) => {

        try {
            const validatedData = RegisterSchema.parse(_req.body);

            if(!validatedData){
                throw new ValidationError("Error trying to parse data", "Error")
            }
        

            const result = await registeration.registerParent(validatedData);

            _res.status(200).json({
                success: true,
                data: result.data,
                message: result.message
            })
        } catch (error) {
            logger.info("Registration error")
            throw new InternalError("Error Registring parent. try again")
        }
    }
}

export const registerController = new RegisterationController();