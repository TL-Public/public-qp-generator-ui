/** @type {import('@sveltejs/kit').Handle} */

import { redirect } from "@sveltejs/kit";
export async function handle({ event, resolve }) {
  // List of routes that don't require authentication
  const accessToken = event.cookies.get('access_token');
  const userName = event.cookies.get('username');
  const roleName = event.cookies.get('role_name');
  const role = event.cookies.get('role');
  const role_code = event.cookies.get('role_code');


  let sessionData ={
    isAuthenticated: !!accessToken,
    accessToken,
    userName,
    role,
    role_code,
    roleName
  }
  event.locals.sessionData = sessionData;

  // const publicRoutes = ['/login', '/register'];
  
  // // Check if the route is public
  // const isPublicRoute = publicRoutes.some(route => 
  //   event.url.pathname.startsWith(route)
  // );

  // // Get the token from the session
  // const token = event.cookies.get('token');

  // if (!isPublicRoute && !token) {
  //   // Redirect to login if trying to access protected route without token
  //   return Response.redirect(`${event.url.origin}/login`, 302);
  // }

  // const response = await resolve(event);
  // return response;

   if (!sessionData?.isAuthenticated) {
    // User is NOT authenticated
  
    const publicPaths = ["/", "/login"];
    const isPublicPath = publicPaths.includes(event.url.pathname);
    if (!event.url.pathname.startsWith("/apis") && !isPublicPath) {
      // Redirect to the login page if not authenticated and trying to access protected route
      const fromUrl = `${event.url.pathname}${event.url.search}`;
      const encodedFromUrl = encodeURIComponent(fromUrl);
      throw redirect(303, `/?redirectTo=${encodedFromUrl}`);
    }
    // If user is not authenticated and visits "/", let them stay (show login page)
  } else {
    // Normalize the current route for RBAC
    // const normalizedRoute = await normalizeRoute(event.url.pathname);

    // // Check if the user role is restricted from accessing the route
    // if (
    //   !event.url.pathname.startsWith("/apis") &&
    //   roleCode &&
    //   roles[roleCode]?.restrictedRoutes?.includes(normalizedRoute)
    // ) {
    //   console.log(
    //     `Access denied for role "${roleCode}" to route "${normalizedRoute}"`,
    //   );
    //   throw redirect(303, "/unauthorized"); // Redirect to an unauthorized page
    // }
    // // User IS authenticated
    // if (
    //   event.url.pathname === "/" &&
    //   !event.url.searchParams.has("redirectTo")
    // ) {
    //   // Redirect authenticated user from login page to home only if no redirectTo param
    //   throw redirect(303, "/home");
    // }
  }

  const response = await resolve(event);
  return response;
}