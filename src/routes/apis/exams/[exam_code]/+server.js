import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, request, cookies, fetch }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);
    const examCode = params.exam_code;

    let endpoint = PUBLIC_API_BASE_URL + "/v1/exams/" + examCode;

    
    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    const options = {
      method: "GET",
      headers: { ...authHeader },
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      let examDetails = await res.json();

      return json(examDetails);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}


export async function PUT({ params, request, cookies, fetch }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);
    const body = await request.json();
    const examCode = params.exam_code;
    
    let endpoint = PUBLIC_API_BASE_URL + "/v1/exams/" + examCode;

    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    const options = {
      method: "PUT",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      let examResponse = await res.json();

      return json(examResponse);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}

export async function DELETE({ params, cookies, fetch }) {
  try {
    const authHeader = getHeaders(cookies);
    const examCode = params.exam_code;

    const endpoint = PUBLIC_API_BASE_URL + "/v1/exams/" + examCode;
    const options = {
      method: "DELETE",
      headers: { ...authHeader },
    };

    const res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      const result = await res.json();
      return json(result);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}

