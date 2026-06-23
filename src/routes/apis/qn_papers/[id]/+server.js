import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, request, cookies, fetch }) {
  try {
    const authHeader = getHeaders(cookies);
    const paperId = params.id;

    let endpoint = PUBLIC_API_BASE_URL + "/v1/qn_papers/" + paperId;

    let queryparams = request.url.split("?");
    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }

    const options = {
      method: "GET",
      headers: { 
        ...authHeader,
        "Accept": request.headers.get("Accept") || "application/json"
      },
    };

    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    // Handle PDF response
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/pdf")) {
      const blob = await res.blob();
      return new Response(blob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": res.headers.get("content-disposition") || `attachment; filename="paper_${paperId}.pdf"`,
        },
      });
    }

    if (res.status == 200) {
      let paperDetails = await res.json();
      return json(paperDetails);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.error(err);
    return new Response(undefined, { status: 500 });
  }
}
