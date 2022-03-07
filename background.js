import {v4 as uuidv4} from 'uuid';

/**
 * When a new tab is created, create a new CookieStore, and assign that tab
 * the new Cookie Store's ID in its .cookieStoreID property.
 * Could be modified to group tabs in Cookie Stores based on container.
 */
chrome.tabs.onCreated.addListener(
    function(tab){
       const newStore = new CookieStore(uuidv4(), [tab.id])
       tab.cookieStoreID = newStore.id
    }
  );

// The following functions are based on parts of the Temporary Containers extension

/**
 * Take the list of cookies coming from this domain, and add the .storeId
 * property, giving it the storeId of the tab from which it was sent
 * 
 * @param {Tab} tab - The tab from which this cookie is being sent
 */
async function setAndAdd(tab){
    // thisDomainCookies is an assumed array of cookies that match this domain
    for(let cookie of thisDomainCookies) {
        /* Create a cookie from the original cookie data, but
           with the added storeId property that matches this tab */
        const newCookie = {
            domain: cookie.domain,
            expirationDate: cookie.expirationDate,
            httpOnly: cookie.httpOnly,
            name: cookie.name,
            path: cookie.path,
            secure: cookie.secure ,
            url: cookie.url,
            value: cookie.value,
            sameSite: cookie.sameSite,
            storeId: tab.cookieStoreId,
        };
        await chrome.cookies.set(newCookie);
    }
}

/**
 * Check whether the given cookie exists within the given tab's Cookie Store
 * 
 * @param {Cookie} cookie 
 * @param {chrome.webRequest._OnBeforeSendHeadersDetails} request - Server requesting cookies
 * @param {Tab} tab
 * @returns Details of cookie in this tab's cookie store, with @param cookie's name.
 *          If no such cookie found, returns null.
 */
async function checkCookie(cookie, request, tab){
    const cookieAllowed = await chrome.cookies.get({
        name: cookie.name,
        url: request.url,
        storeId: tab.cookieStoreId,
      });
    return cookieAllowed;
}

/**
 * Add cookies from given tab to Map that may be turned into a cookie header for given request
 * 
 * @param {chrome.webRequest._OnBeforeSendHeadersDetails} request - Server requesting cookies
 * @param {Tab} tab - Tab checking which cookies exist in its Cookie Store
 * @returns Map of cookies that are allowed to be sent to the server who gave the request
 */
async function addRequestCookies(request, tab){
    const newCookiesHeader = new Map();
    // allCookies is an assumed array of all cookies
    for(let cookie of allCookies) {
        let allowedCookie = checkCookie(cookie, request, tab);
        if(allowedCookie){
            newCookiesHeader.set(allowedCookie.name, allowedCookie.value);
        }
    }
    return newCookiesHeader;
}

