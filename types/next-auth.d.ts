import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      storeProfile?: any;
      employeeProfile?: any;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    storeProfile?: any;
    employeeProfile?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    storeProfile?: any;
    employeeProfile?: any;
  }
}
