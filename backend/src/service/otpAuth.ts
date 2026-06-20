import { prisma } from "@/lib/prisma";
import { AuthenticationError, NotFoundError } from "@/utils/error";
import crypto from "crypto"


interface PhoneNumberDTO {
    phoneNumber: string;
}

interface OTPDTO {
    phoneNumber: string;
    otp: string;
}

class OTPAuth {

    //parents generate their 4 digits receive their otp
    async createOtp(data: PhoneNumberDTO) {
        const {phoneNumber} = data;

        const parent = await prisma.parent.findUnique({where: {phoneNumber}});

        if (!parent){
            throw new NotFoundError("Number not registered")
        }

        const otp = crypto.randomInt(1000, 9999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.parent.update({where: {phoneNumber: phoneNumber}, data: {otpCode: otp, otpExpiresAt: expiresAt}});

        return {
            message: "Otp has been successfully created",
        }
    }


    //parents input and verify otp code
    async verifyOtp(data: OTPDTO) {
        const {phoneNumber, otp} = data;

        const parent = await prisma.parent.findUnique({where: {phoneNumber}})

        if (!parent || parent.otpCode != otp || !parent.otpExpiresAt || parent.otpExpiresAt < new Date()) {
            throw new AuthenticationError("Invalid or expired OTP")
        }

        //clear otp after use
        await prisma.parent.update({
            where: {id: parent.id},
            data: {otpCode: null, otpExpiresAt: null}
        });

        return {
            message: "OTP verfied succefully"
        }
    }
}

export const otpauth = new OTPAuth()