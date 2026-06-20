import { Request, Response } from "express";
import { logger } from "@/utils/logger";
import {z} from "zod"
import { InternalError, ValidationError } from "@/utils/error";
import { otpauth } from "@/service/otpAuth";


const phoneNumberSchema = z.object({
    phoneNumber: z.string().min(10).max(20)
});

const otpSchema = z.object({
    phoneNumber: z.string().min(10).max(20),
    otp: z.string().length(4)
});



class OTPAuthController {
    async createOtpController(_req: Request, _res: Response) {

        try {
            const parsedData = phoneNumberSchema.parse(_req.body);

            if (!parsedData) {
                throw new ValidationError("Invalid phone Number")
            }

            const res = await otpauth.createOtp(parsedData);

            _res.status(200).json({
                success: true,
                message: res.message
            })

        
        } catch (error) {
            logger.error("Error occurred creating otp")
            throw new InternalError("Error occured creating otp")
        }

    }

    async verifyOtpController(_req: Request, _res: Response) {
        try {
            const parsedData = otpSchema.parse(_req.body);

            if (!parsedData) {
                throw new ValidationError("Invalid phone number or otp code format");
            }

            const res = await otpauth.verifyOtp(parsedData);

            _res.status(200).json({
                success: true,
                message: res.message
            })

        
        } catch (error) {
            logger.error("Error occurred verifying otp")
            throw new InternalError("Error occured verifying otp")
        }

    }
}

export const otpAuthController = new OTPAuthController()