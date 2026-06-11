import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
  secret: "IMM3IAsY35w4MGjqvpyliYUQbFs8ODlG"
});

export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico|uploads).*)"]
};
