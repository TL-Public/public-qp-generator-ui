import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ request, cookies, fetch }) {
  try {
    const authHeader = getHeaders(cookies);

    const endpoint = `${PUBLIC_API_BASE_URL}/v1/roles`;

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
    console.error("Error in roles API route:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
