import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt-ts";
import { prisma } from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { loginSchema } from "./validations/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      // Kita definisikan field yang dikirimkan oleh form login Anda
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // Menerima "buyer" atau "seller"
      },
      async authorize(credentials) {
        // 1. Validasi input form dasar
        const validation = loginSchema.safeParse(credentials);

        if (!validation.success) {
          // Mengambil pesan error pertama dari Zod
          const firstError =
            validation.error.issues[0]?.message || "Input tidak valid";
          throw new Error(firstError);
        }

        const { email, password, role } = validation.data;

        // 2. Cari user di database berdasarkan Email
        const user = await prisma.user.findUnique({
          where: { email: email },
          include: {
            storeProfile: true,
            employeeProfile: {
              include: {
                warehouses: true,
                storeProfile: true,
              }
            }
          }
        });

        if (!user || !user.password) {
          throw new Error("server.notFound");
        }

        // 3. Validasi Password menggunakan Bcrypt
        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("server.wrongPassword");
        }

        // 4. Validasi kecocokan Role (Mengonversi string UI ke Enum DB)
        const expectedRole = role.toUpperCase(); // "BUYER" or "SELLER"
        
        const isAllowed = 
          user.role === expectedRole || 
          (expectedRole === "SELLER" && user.role === "EMPLOYEE");

        if (!isAllowed) {
          throw new Error(`server.roleMismatch:${user.role}`);
        }

        // 5. Kembalikan data user yang sukses divalidasi (Akan diteruskan ke JWT)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          storeProfile: user.role === "EMPLOYEE" ? user.employeeProfile?.storeProfile : user.storeProfile, // Penting untuk otorisasi halaman kelak
          employeeProfile: user.role === "EMPLOYEE" ? user.employeeProfile : undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          // Buat akun dengan role BUYER secara default
          await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
              data: {
                email: user.email as string,
                name: user.name || "",
                role: "BUYER",
              },
            });

            await tx.buyerProfile.create({
              data: {
                userId: created.id,
              },
            });
          });
        }
        return true;
      }
      return true; // Untuk Credentials
    },
    // Memasukkan data role dari authorize() ke dalam token JWT
    async jwt({ token, user, trigger, session, account }) {
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.email !== undefined) token.email = session.email;
        if (session.image !== undefined) {
          token.picture = session.image;
          if ((token as any).storeProfile) {
            (token as any).storeProfile.logoUrl = session.image;
          }
        }
        if (session.storeProfile !== undefined) (token as any).storeProfile = session.storeProfile;
      }

      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
             where: { email: user.email! },
             include: {
               storeProfile: true,
               employeeProfile: {
                 include: {
                   storeProfile: true
                 }
               }
             }
           });
           
           if (dbUser) {
             (token as any).id = dbUser.id;
             (token as any).role = dbUser.role;
             (token as any).storeProfile = dbUser.role === "EMPLOYEE" ? dbUser.employeeProfile?.storeProfile : dbUser.storeProfile;
             if (dbUser.role === "EMPLOYEE") {
               (token as any).employeeProfile = dbUser.employeeProfile;
             }
           }
        } else {
          // Cast to any to avoid TypeScript errors when using custom fields
          (token as any).id = (user as any).id;
          (token as any).role = (user as any).role;
          (token as any).storeProfile = (user as any).storeProfile;
          if ((user as any).employeeProfile) {
            (token as any).employeeProfile = (user as any).employeeProfile;
          }
        }
      }

      return token;
    },
    // Memasukkan data role dari JWT ke session agar bisa diakses di UI komponen ("use client")
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string | null | undefined;
        
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).storeProfile = (token as any).storeProfile;
        if ((token as any).employeeProfile) {
          (session.user as any).employeeProfile = (token as any).employeeProfile;
        }

        // Generate Supabase JWT Token yang sah
        const signingSecret = process.env.SUPABASE_JWT_SECRET;
        if (signingSecret) {
          const payload = {
            aud: "authenticated",
            role: "authenticated",
            sub: token.id, // ID User kamu
            email: session.user.email,
            app_metadata: {
              provider: "nextauth",
            },
            user_metadata: {
              role: token.role,
            },
            // Expired dalam 1 jam
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
          };

          // Simpan Supabase JWT ke objek session
          (session as any).supabaseToken = jwt.sign(payload, signingSecret);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in", // Sesuai dengan folder src/app/(auth)/sign-in Anda
  },
  session: {
    strategy: "jwt", // Menggunakan JWT session (standar untuk Next.js)
  },
  secret: process.env.NEXTAUTH_SECRET, // Pastikan token ini sudah ditambahkan di file .env
};
