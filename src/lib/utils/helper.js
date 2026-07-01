import { browser } from "$app/environment";
import { goto } from "$app/navigation";

// Create a question object from API result and payload (for dynamic qn addition )

// UTILITY TO GET HEADERS
export function getHeaders(cookies, contentType = "application/json") {
  const authToken = cookies.get("accessToken");
  if (authToken) {
    const headers = {
      "Content-Type": contentType,
      Authorization: `Bearer ${authToken}`,
    };
    return headers;
  }
  return {};
}

export function clearAllCookies(cookies) {
  for (const { name } of cookies.getAll()) {
    cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

// UTILITY FOR CONVERTING DATE AND TIME
export function formatDDMMYYYY(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "N/A";
  }
}

// takes in date string and converts to this format: 24/6/2026, 7:43:35 am
export function formatDate(date) {
  return new Date(date).toLocaleString();
}
// Helper: convert route pattern to regex (e.g. '/quiz/:exam_code/attempt')
export function routePatternToRegex(route) {
  // Escape regex special chars except for :param
  let regexStr = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([a-zA-Z0-9_]+)/g, "[^/]+");
  return new RegExp("^" + regexStr + "$");
}

export function checkSidebarRules(rules, url) {
  // Helper: convert route pattern to regex (e.g. '/quiz/:exam_code/attempt')
  function routePatternToRegex(route) {
    let regexStr = route
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/:([a-zA-Z0-9_]+)/g, "[^/]+");
    return new RegExp("^" + regexStr + "$");
  }
  // Map rules to add regex, then check
  return rules.some((rule) => {
    const pathRegex = routePatternToRegex(rule.route);
    if (!pathRegex.test(url.pathname)) return false;
    if (rule.query) {
      return Object.entries(rule.query).every(
        ([key, val]) => url.searchParams.get(key) === val
      );
    }
    return true;
  });
}







export async function handleRedirection(status, url, params) {
  if (browser) {
    const fromUrl = url + params;
    switch (status) {
      case 401:
        await goto(`/?redirectTo=${fromUrl}`);
        break;
      case 403:
        // await goto(`/unauthorized?redirectTo=${fromUrl}`);
        break;
      default:
        break;
    }
  }
}

/**
 * Helper to batch API calls with Promise.all.
 * If any call returns 401/403, handleRedirection is called and the rest are not awaited.
 * Returns an array of results (null for failed/redirected calls).
 * Usage: await apiBatch([url1, url2, ...], params, url)
 */
export async function apiBatch(urls, params = "", pageUrl = "") {
  let redirected = false;
  const results = await Promise.all(
    urls.map(async (url) => {
      if (redirected) return null;
      try {
        const res = await fetch(url);
        if (!res || !res.ok) {
          if (res?.status === 401 || res?.status === 403) {
            redirected = true;
            await handleRedirection(
              res.status,
              pageUrl?.pathname || "",
              pageUrl?.search || "",
              params
            );
            return null;
          }
          return null;
        }
        return await res.json();
      } catch (err) {
        return null;
      }
    })
  );
  console.log("results", results);
  return results;
}

// Normalize dynamic routes for consistency ---- this converts uuid, AlphaNumeric IDs starting with Q like Q1234, and numeric IDs to ':id'
export async function normalizeRoute(route) {
  if (!route || typeof route !== 'string') return '';
  return route
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}(?=$|[/?])/gi, "/:id")
    .replace(/\/Q\d+(?=$|[/?])/gi, "/:id");
}

export function mapApiError(status, resource = "resource") {
  switch (status) {
    case 401:
      return "You are not authenticated.";
    case 403:
      return "You are not authorized to do this action.";
    case 404:
      return `The ${resource} you are looking for could not be found.`;
    case 409:
      return `Error-409. The ${resource} you are trying to create is already present`;
    case 422:
      return `Error-422. Unprocessable request`;
    case 500:
      return "Error-500. Something went wrong on our end.";
    case 502:
      return "Error-502. Received an invalid response from the upstream server.";
    case 504:
      return "Error-504. Server is busy. Please try again after some time.";
    default:
      return "Something went wrong.";
  }
}

/**
 * Traps focus within a modal or container element using Tab navigation
 * @param {KeyboardEvent} event - The keyboard event
 * @param {HTMLElement} containerRef - Reference to the container element
 */
export function trapFocusInsideModal(event, containerRef) {
  // Only handle tab trapping
  if (event.key !== 'Tab' || !containerRef) return;

  const focusableElements = containerRef.querySelectorAll(
    'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab (going backwards)
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab (going forwards)
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}




// Inject Google Analytics loader and inline init into <head>
// measurementId: GA4 ID string (e.g., 'G-XXXX')
// options: optional { loaderId?: string, initId?: string }
export function injectGAHead(measurementId, options = {}) {
	try {
		if (!measurementId || typeof document === 'undefined') return;

		const loaderId = options.loaderId || 'ga4-loader';
		const initId = options.initId || 'ga4-inline-init';

		if (!document.getElementById(loaderId)) {
			const s = document.createElement('script');
			s.async = true;
			s.id = loaderId;
			s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
			document.head.appendChild(s);
		}

		if (!document.getElementById(initId)) {
			const s2 = document.createElement('script');
			s2.id = initId;
			s2.textContent =
				'window.dataLayer=window.dataLayer||[];' +
				'function gtag(){dataLayer.push(arguments);} ' +
				"gtag('js', new Date()); " +
				"gtag('config', '" + measurementId + "');";
			document.head.appendChild(s2);
		}
	} catch (e) {
		// avoid breaking rendering
		console.warn('injectGAHead failed', e);
	}
}


export function generateStrongPassword(length = 12){
      const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
      const numberChars = "0123456789";
      const specialChars = '!@#$%^&*(),.?":{}|<>';

      const allChars =
        uppercaseChars + lowercaseChars + numberChars + specialChars;

      let password = "";

      password +=
        uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
      password +=
        lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
      password += numberChars[Math.floor(Math.random() * numberChars.length)];
      password += specialChars[Math.floor(Math.random() * specialChars.length)];

      for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }

      return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
}

export function validatePasswordInput(newPassword, confirmPassword, apiValidatePassword = null) {
  const errors = {};
  let isValid = true;

  if (!newPassword) {
    errors.new_password = "Password is required";
    isValid = false;
  } else if (apiValidatePassword) {
    try {
      const validation = apiValidatePassword({
        new_password: newPassword,
      });

      if (!validation.isValid) {
        errors.new_password = validation.errors.join(". ");
        isValid = false;
      }
    } catch (e) {
      if (newPassword.length < 8) {
        errors.new_password = "Password must be at least 8 characters long";
        isValid = false;
      }
    }
  } else if (newPassword.length < 8) {
    errors.new_password = "Password must be at least 8 characters long";
    isValid = false;
  }

  if (!confirmPassword) {
    errors.confirm_password = "Please confirm your password";
    isValid = false;
  } else if (newPassword !== confirmPassword) {
    errors.confirm_password = "Passwords do not match";
    isValid = false;
  }

  return { isValid, errors };
}