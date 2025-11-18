import twilio from "twilio";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import prisma from "../lib/prisma.js";

// the user will be authenticated using the twillo thing

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const OTP_TTL_MS =
  parseInt(process.env.PHONE_LOGIN_OTP_TTL_MS ?? "300000", 10) || 300000;

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex").toString();

const generateOtp = () =>
  (Math.floor(100000 + Math.random() * 900000)).toString();

const sendOtpSms = async (phone, otp) => {
  const body = `Your login code is ${otp}. It expires in ${Math.floor(
    OTP_TTL_MS / 60000
  )} minutes.`;

  if (
    twilioClient &&
    (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER)
  ) {
    const payload = {
      to: phone,
      body,
    };

    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      payload.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else {
      payload.from = process.env.TWILIO_PHONE_NUMBER;
    }

    await twilioClient.messages.create(payload);
  } else {
    console.warn(
      "[Auth] Twilio credentials missing. OTP:",
      otp,
      "Phone:",
      phone
    );
  }
};

export class UserController {
  static requestLoginOtp = async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ message: "Phone number is required." });
      }

      const otp = generateOtp();
      const hashed = hashOtp(otp);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      await prisma.phoneOtp.create({
        data: {
          phone,
          code: hashed,
          expiresAt,
        },
      });

      await sendOtpSms(phone, otp);

      return res.status(200).json({
        message: "OTP sent. It is valid for the next few minutes.",
      });
    } catch (error) {
      console.error("[Auth] requestLoginOtp failed:", error);
      return res.status(500).json({ message: "Unable to send OTP right now." });
    }
  };

  static verifyLoginOtp = async (req, res) => {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res
          .status(400)
          .json({ message: "Phone number and OTP are required." });
      }

      const existingOtp = await prisma.phoneOtp.findFirst({
        where: {
          phone,
          consumed: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!existingOtp) {
        return res.status(400).json({ message: "OTP not found. Request a new one." });
      }

      if (existingOtp.expiresAt < new Date()) {
        await prisma.phoneOtp.update({
          where: { id: existingOtp.id },
          data: { consumed: true },
        });
        return res.status(400).json({ message: "OTP expired. Request a new one." });
      }

      if (hashOtp(otp) !== existingOtp.code) {
        return res.status(401).json({ message: "Invalid OTP." });
      }

      await prisma.phoneOtp.update({
        where: { id: existingOtp.id },
        data: { consumed: true },
      });

      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found. Please register before logging in.",
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("[Auth] JWT_SECRET missing");
        return res.status(500).json({ message: "Server misconfiguration." });
      }

      const token = jwt.sign(
        {
          sub: user.id,
          phone: user.phone,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "12h" }
      );

      return res.status(200).json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] verifyLoginOtp failed:", error);
      return res
        .status(500)
        .json({ message: "Unable to verify OTP right now." });
    }
  };
}