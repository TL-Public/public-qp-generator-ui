export const rolePermissions = {
  // Access by role code (used by hooks and components)
  "100": {
    restrictedRoutes: [],
    restrictedMenuList: [],
  },
  "101": {
    restrictedRoutes: ["/admin/settings", "/users/management"],
    restrictedMenuList: ["ADMIN_SETTINGS", "USER_MANAGEMENT"],
  },
  "102": {
    restrictedRoutes: ["/admin/settings", "/questions/add", "/uploadHistory"],
    restrictedMenuList: ["ADMIN_SETTINGS", "ADD_QUESTION", "HISTORY"],
  },
  "1000": {
    restrictedRoutes: ["/admin/settings", "/questions/add", "/uploadHistory"],
    restrictedMenuList: ["ADMIN_SETTINGS", "ADD_QUESTION", "HISTORY"],
  },
  
  // Access by role name (for fallback / compatibility)
  admin: {
    restrictedRoutes: [],
    restrictedMenuList: [],
  },
  teacher: {
    restrictedRoutes: ["/admin/settings", "/users/management"],
    restrictedMenuList: ["ADMIN_SETTINGS", "USER_MANAGEMENT"],
  },
  student: {
    restrictedRoutes: ["/admin/settings", "/questions/add", "/uploadHistory"],
    restrictedMenuList: ["ADMIN_SETTINGS", "ADD_QUESTION", "HISTORY"],
  }
};

export function isActionRestricted(route, action, userRole) {
	if (!userRole || !route || !action) {
		return true;
	}

	const roleConfig = rolePermissions[userRole];
	if (!roleConfig || !roleConfig.restrictedActions) {
		return false;
	}

	// ✅ HANDLE dynamic routes like /:id/
	const routeKey = Object.keys(roleConfig.restrictedActions).find((key) => {
		if (key.includes(':id')) {
			const base = key.split(':id')[0];
			return route.startsWith(base);
		}
		return route === key;
	});

	const routeRestrictions = roleConfig.restrictedActions?.[routeKey];

	if (!routeRestrictions || !Array.isArray(routeRestrictions)) {
		return false;
	}

	return routeRestrictions.includes(action);
}


export function isActionAllowed(route, action, userRole) {
	return !isActionRestricted(route, action, userRole);
}


export function isMenuRestricted(menuTitle, userRole) {
	if (!userRole || !menuTitle) {
		return true;
	}

	const roleConfig = rolePermissions[userRole];
	if (!roleConfig || !roleConfig.restrictedMenuList) {
		return false;
	}

	return roleConfig.restrictedMenuList.includes(menuTitle);
}


export function isMenuAllowed(menuTitle, userRole) {
	return !isMenuRestricted(menuTitle, userRole);
}
