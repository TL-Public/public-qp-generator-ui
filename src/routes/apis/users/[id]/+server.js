import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, cookies, fetch }) {
  try {
    const authHeader = getHeaders(cookies);

    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/${params.id}`;

    const options = {
      method: "GET",
      headers: { 
        ...authHeader 
      },
    };

    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    const data = await res.json();
    return json(data);
  } catch (err) {
    console.error("Error in get user API route:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function PUT({ params, request, cookies, fetch }) {
  try {
    const authHeader = getHeaders(cookies);
    const body = await request.json();

    const endpoint = `${PUBLIC_API_BASE_URL}/v1/users/${params.id}`;

    const options = {
      method: "PUT",
      headers: { 
        ...authHeader, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body),
    };

    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    const data = await res.json();

    // If the updated user is the currently logged-in user, update SvelteKit's userName cookie
    const loggedInUserId = cookies.get("userId");
    if (loggedInUserId === params.id && data && data.username) {
      cookies.set("userName", data.username, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return json(data);
  } catch (err) {
    console.error("Error in update user API route:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
