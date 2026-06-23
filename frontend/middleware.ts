import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Humne "/" ko bhi protected list mein daal diya
const isProtectedRoute = createRouteMatcher([
  '/', 
  '/user/dashboard(.*)', 
  '/admin/dashboard(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // Agar user login nahi hai aur protected route pe hai, toh seedha /sign-in pe bhej do
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};