import axios from "axios";
import { redis } from "../config/redis";
import { ApiError } from "../common/response";
import { HTTP_STATUS } from "../common/constants";

const AUTHKEY = process.env.AUTHKEY_API_KEY || "";
const OTP_EXPIRY_SECONDS = 120; // 2 minutes

const DEV_OTP = "123456";

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  if (true) {
    return DEV_OTP;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS using AuthKey API
 */
async function sendOTPViaSMS(
  countryCode: string,
  phoneNumber: string,
  otp: string,
  isExistingUser: boolean
): Promise<void> {
  try {
    const message = isExistingUser
      ? `Your OTP for QueztLearn login is ${otp}. Valid for 5 minutes. Do not share with anyone.`
      : `Welcome to QueztLearn! Your OTP for registration is ${otp}. Valid for 5 minutes.`;

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // AuthKey SMS API call
    const response = await axios.get("https://api.authkey.io/request", {
      params: {
        authkey: AUTHKEY,
        mobile: fullPhoneNumber,
        country_code: countryCode,
        sms: message,
        sender: "QZTLRN", // Sender ID (6 chars, needs to be approved by AuthKey)
      },
    });

    if (response.data.status !== "success") {
      throw new Error("Failed to send OTP");
    }
  } catch (error: any) {
    console.error("Error sending OTP via SMS:", error.message);
    throw new ApiError(
      "Failed to send OTP. Please try again.",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Generate and send OTP
 */
export async function generateAndSendOTP(
  countryCode: string,
  phoneNumber: string,
  isExistingUser: boolean
): Promise<string> {
  if (!redis) {
    throw new ApiError(
      "OTP service unavailable",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  const otp = generateOTP();

  // Store OTP in Redis with expiry
  const redisKey = `otp:${countryCode}${phoneNumber}`;
  await redis.setex(redisKey, OTP_EXPIRY_SECONDS, otp);
  if (false) {
    await sendOTPViaSMS(countryCode, phoneNumber, otp, isExistingUser);
  } else {
    console.log(`[DEV MODE] OTP for ${countryCode}${phoneNumber}: ${otp}`);
  }

  return otp;
}

export async function verifyOTP(
  countryCode: string,
  phoneNumber: string,
  otp: string
): Promise<boolean> {
  if (!redis) {
    throw new ApiError(
      "OTP service unavailable",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  const redisKey = `otp:${countryCode}${phoneNumber}`;
  const storedOTP = await redis.get(redisKey);

  if (!storedOTP) {
    throw new ApiError("OTP expired or not found", HTTP_STATUS.BAD_REQUEST);
  }

  if (storedOTP !== otp) {
    throw new ApiError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
  }

  // Delete OTP after successful verification
  await redis.del(redisKey);

  return true;
}

/**
 * Check if OTP is valid (for testing purposes)
 */
export async function isOTPValid(
  countryCode: string,
  phoneNumber: string
): Promise<boolean> {
  if (!redis) return false;

  const redisKey = `otp:${countryCode}${phoneNumber}`;
  const storedOTP = await redis.get(redisKey);
  return !!storedOTP;
}
