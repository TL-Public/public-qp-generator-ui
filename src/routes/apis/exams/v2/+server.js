import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

// export async function GET({ params, request, cookies, fetch }) {
//   let res;
//   try {
//     const authHeader = getHeaders(cookies);

//     let endpoint = PUBLIC_API_BASE_URL + "/v2/exams";

//     let queryparams = request.url.split("?");

//     if (queryparams?.length > 1) {
//       endpoint += "?" + queryparams[1];
//     }
//     const options = {
//       method: "GET",
//       headers: { ...authHeader },
//     };

//     res = await fetch(endpoint, options);

//     if (!res.ok) {
//       return res;
//     }

//     if (res.status == 200) {
//       let exams = await res.json();

//       return json(exams);
//     }

//     return new Response("", { status: res.status });
//   } catch (err) {
//     console.log(err);
//     return new Response(undefined, { status: 500 });
//   }
// }

export async function POST({ params, request, cookies, fetch }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);
    const body = await request.json();

    let endpoint = PUBLIC_API_BASE_URL + "/v2/exams";

    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    const options = {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 201) {
      let examResponse = await res.json();

      return json(examResponse);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}
