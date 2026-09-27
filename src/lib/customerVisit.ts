export function clearCustomerVisit() {
    for (const key of ['currentUserLookup', 'currentUserEmail', 'currentUserPhone', 'currentUserName', 'currentUserInfo', 'currentVisitGuest', 'contactedFirstInfo']) {
        localStorage.removeItem(key);
    }
}

export function rememberCustomerVisit(
    input: string,
    name = '',
    extra?: { phone?: string; email?: string; gender?: string | null }
) {
    clearCustomerVisit();
    const type = input.includes('@') ? 'email' : 'phone';
    const value = type === 'email' ? input.trim().toLowerCase() : input.trim().replace(/[\s\-()]/g, '');
    localStorage.setItem('currentUserLookup', `${type}:${value}`);

    const finalEmail = (extra?.email || (type === 'email' ? value : '')).trim().toLowerCase();
    const finalPhone = (extra?.phone || (type === 'phone' ? value : '')).trim();
    const finalName = name || '';
    const finalGender = extra?.gender || '';

    if (finalEmail) localStorage.setItem('currentUserEmail', finalEmail);
    if (finalPhone) localStorage.setItem('currentUserPhone', finalPhone);
    if (finalName) localStorage.setItem('currentUserName', finalName);

    localStorage.setItem('currentUserInfo', JSON.stringify({
        fullName: finalName,
        name: finalName,
        email: finalEmail,
        phone: finalPhone,
        gender: finalGender,
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
