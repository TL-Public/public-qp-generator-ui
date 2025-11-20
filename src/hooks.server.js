/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // List of routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );

  // Get the token from the session
  const token = event.cookies.get('token');

  if (!isPublicRoute && !token) {
    // Redirect to login if trying to access protected route without token
    return Response.redirect(`${event.url.origin}/login`, 302);
  }

  const response = await resolve(event);
  return response;
}