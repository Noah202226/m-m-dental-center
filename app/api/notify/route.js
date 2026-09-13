import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email, patientName, date, time, status, notes } = await req.json();

    // 1. Dental Tips Array
    const dentalTips = [
      "Don't forget to brush your tongue! It helps remove bacteria and keeps your breath fresh.",
      "Replace your toothbrush every 3 to 4 months, or sooner if the bristles are frayed.",
      "Flossing once a day helps remove plaque from areas your toothbrush can't reach.",
      "Limit sugary snacks and drinks to protect your tooth enamel from acid attacks.",
      "Drinking water after meals helps wash away food particles and neutralizes acid.",
      "Brushing twice a day for two minutes is the gold standard for a healthy smile!",
    ];
    const randomTip = dentalTips[Math.floor(Math.random() * dentalTips.length)];

    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const isConfirmed = status === "confirmed";
    const isCancelled = status === "cancelled";
    const brandColor = isCancelled ? "#e11d48" : "#f59e0b";
    const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "M&M Dental Center";
    const bookingLink = process.env.NEXT_PUBLIC_BOOKING_LINK || "#";

    const mailOptions = {
      from: `${clinicName} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isCancelled
        ? `Update: Appointment Cancelled - ${clinicName}`
        : `Confirmed: Your Dental Visit at ${clinicName}`,
      html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #f1f5f9; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 4px solid ${brandColor};">
          <p style="margin: 0; color: ${brandColor}; font-weight: 800; font-size: 16px; letter-spacing: 2px; text-transform: uppercase;">${clinicName}</p>
        </div>

        <div style="padding: 40px 30px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: ${brandColor}; font-size: 22px; margin-bottom: 20px; text-align: center;">
            ${isCancelled ? "Appointment Cancellation" : "Appointment Confirmed"}
          </h2>
          
          <p style="font-size: 16px;">Hi <strong>${patientName}</strong>,</p>
          
          ${
            isCancelled
              ? `<p style="font-size: 15px; color: #475569;">Unfortunately, your requested dental appointment on <b>${formattedDate}</b> at <b>${time}</b> has been <strong>CANCELLED</strong> due to an unforeseen schedule conflict or unavailability.</p>`
              : `<p style="font-size: 15px; color: #475569;">We are pleased to inform you that your dental appointment on <b>${formattedDate}</b> at <b>${time}</b> has been <strong>CONFIRMED</strong>.</p>`
          }

          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 20px; margin: 25px 0;">
             <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: bold;">Quick Summary:</p>
             <p style="margin: 5px 0; font-size: 14px;">📅 <b>Date:</b> ${formattedDate}</p>
             <p style="margin: 5px 0; font-size: 14px;">⏰ <b>Time:</b> ${time}</p>
             <p style="margin: 5px 0; font-size: 14px;">📍 <b>Location:</b> 51 Xavierville Avenue Loyola Heights Quezon City, Metro Manila, Philippines (Unit 205)</p>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
          
            <a href="${isCancelled ? bookingLink : "https://web.facebook.com/ManilaDentalArts/?_rdc=1&_rdr#"}" 
               style="background-color: ${brandColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
               ${isCancelled ? "Reschedule Appointment" : "Get Directions on Facebook"}
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 25px;">
            <div style="background-color: ${isCancelled ? "#fff1f2" : "#f0f9ff"}; border-radius: 12px; padding: 15px;">
              <p style="margin: 0; font-size: 14px; color: ${brandColor}; font-weight: bold;">🦷 Dental Care Tip of the Day:</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #334155; font-style: italic;">"${randomTip}"</p>
            </div>
          </div>
        </div>

        <div style="background-color: #0f172a; padding: 30px; text-align: center; color: #ffffff;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 700;">${clinicName}</h3>
          <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 15px 0;">Monday - Tuesday | Closed</p>
          <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 15px 0;">Wednesday - Friday | 10AM to 6PM</p>
          <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 15px 0;">Saturday - Sunday | 9AM to 5PM</p>
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #1e293b;">
            <p style="margin: 0; font-size: 10px; color: #64748b; letter-spacing: 1px;">POWERED BY</p>
            <a href="https://www.facebook.com/ArcTechSolutions25" style="text-decoration: none; color: #38bdf8; font-size: 13px; font-weight: bold;">
              ARC TECH SOLUTIONS
            </a>
            <img src="https://dental-clinic-v3-arctech.vercel.app/logo.png" alt="${clinicName} Logo" style="height: 60px; margin-bottom: 10px;">
          </div>
        </div>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
