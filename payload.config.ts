import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { Addresses } from "./collections/Addresses";
import { Feedback } from "./collections/Feedback";
import { Warehouses } from "./collections/Warehouses";
import { DiscountCodes } from "./collections/DiscountCodes";
import { Sellers } from "./collections/Sellers";
import { SellerMembers } from "./collections/SellerMembers";
import { TeamInvites } from "./collections/TeamInvites";
import { Carts } from "./collections/Carts";
import { SupportTickets } from "./collections/SupportTickets"
import { SupportMessages } from "./collections/SupportMessages"
import { Wishlist } from "./collections/Wishlist"
import { Reviews } from "./collections/Reviews";
import { MediaFolders } from "./collections/MediaFolders";
import { VerificationSessions } from "./collections/VerificationSessions";
import { Meetings } from "./collections/Meetings";
import { Availability } from "./collections/Availability";
import { Leads } from "./collections/Leads";
import { EmailLogs } from "./collections/EmailLogs";
import { CallLogs } from "./collections/CallLogs";
import { EmailTemplates } from "./collections/EmailTemplates";
import { ProductRequests } from "./collections/ProductRequests";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, MediaFolders, Categories, Products, Orders, Addresses, Feedback, Warehouses, DiscountCodes, Sellers, SellerMembers, TeamInvites, Carts, SupportTickets, SupportMessages, Wishlist, Reviews, VerificationSessions, Meetings, Availability, Leads, EmailLogs, CallLogs, EmailTemplates, ProductRequests],
  onInit: async () => {
    try {
      // Enforce a 3-day (259200 seconds) TTL on support messages
      const db = mongoose.connection.db;
      if (db) {
        await db.collection("support-messages").createIndex(
          { createdAt: 1 },
          { expireAfterSeconds: 3 * 24 * 60 * 60 }
        );
        console.log("✅ MongoDB TTL Index established for support-messages (3 days)");
      }
    } catch (err) {
      console.error("⚠️ Failed to establish TTL index:", err);
    }
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || "noreply@localhost",
    defaultFromName: "Stond Emporium",
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
  }),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp,
  serverURL: process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000",
  cors: [
    "https://stondemporium.tech",
    "https://www.stondemporium.tech",
    "http://localhost:3000"
  ],
  csrf: [
    "https://stondemporium.tech",
    "https://www.stondemporium.tech",
    "http://localhost:3000"
  ],
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET ?? '',
      config: {
        endpoint: process.env.R2_ENDPOINT ?? '',
        region: "auto",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
        forcePathStyle: true, // Required for Cloudflare R2
      },
    }),
  ],
});
