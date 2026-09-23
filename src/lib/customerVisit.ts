export function clearCustomerVisit() {
    for (const key of ['currentUserLookup', 'currentUserEmail', 'currentUserPhone', 'currentUserName', 'currentUserInfo', 'currentVisitGuest', 'contactedFirstInfo']) {
        localStorage.removeItem(key);
    }
}

export function rememberCustomerVisit(input: string, name = '') {
    clearCustomerVisit();
    const type = input.includes('@') ? 'email' : 'phone';
    const value = type === 'email' ? input.trim().toLowerCase() : input.trim().replace(/[\s\-()]/g, '');
    localStorage.setItem('currentUserLookup', `${type}:${value}`);
    localStorage.setItem(type === 'email' ? 'currentUserEmail' : 'currentUserPhone', value);
    localStorage.setItem('currentUserInfo', JSON.stringify({
        fullName: name,
        email: type === 'email' ? value : '',
        phone: type === 'phone' ? value : '',
    }));
}

export function startGuestVisit() {
    clearCustomerVisit();
    localStorage.setItem('currentVisitGuest', '1');
}

export function clearTabletCustomerVisit() {
    if (localStorage.getItem('REGISTERED_DEVICE_ID')) startGuestVisit();
}

export function shouldAutofillAuth(user: { email?: string; phone?: string }) {
    if (localStorage.getItem('currentVisitGuest')) return false;
    const lookup = localStorage.getItem('currentUserLookup');
    if (!lookup) return true;
    return lookup === `email:${user.email?.trim().toLowerCase()}` || lookup === `phone:${user.phone?.trim().replace(/[\s\-()]/g, '')}`;
}
