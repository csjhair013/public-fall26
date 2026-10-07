import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({
    path: new URL("../../.env", import.meta.url),
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },

});

export default transporter;