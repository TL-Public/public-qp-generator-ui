import { json as json$1 } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function POST({ params, request, cookies, fetch: eventFetch }) {
  try {
    const body = await request.json();
   

    const endpoint = PUBLIC_API_BASE_URL + "/v1/login";
   
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };

    // Use eventFetch instead of fetch
    const res = await eventFetch(endpoint, options);
    if (res.status == 200) {
        const user = await res.json();
        
      cookies.set("accessToken", user.access_token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        // secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      // Refresh token: 14 days
   
      cookies.set("tokenType", user.token_type, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        // secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("userName", user.username, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        // secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("userId", String(user.user_id), {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        // secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("roleName", user.role_name, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        // secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      cookies.set("roleCode", user.role_code, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        // secure:false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return json$1(
        {
          userName: user.username,
          roleName: user.role_name,
          roleCode: user.role_code,
          // role: user.role,
          userId: user.user_id,
        },
        {
          status: 200,
        }
      );
    }

    return new Response(res.body, { status: res.status });
  } catch (err) {
    
    // Always return a Response in case of errors
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}