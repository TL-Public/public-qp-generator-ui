import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function POST({ request, cookies, fetch }) {
  try {
    const authHeader = getHeaders(cookies);
    const body = await request.json();

    let endpoint = PUBLIC_API_BASE_URL + "/v2/exams/design-feasibility";

    let queryparams = request.url.split("?");
    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }

    const options = {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };

    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    const data = await res.json();
    return json(data);
  } catch (err) {
    console.error("Error in design feasibility endpoint:", err);
    return new Response(JSON.stringify({ detail: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
