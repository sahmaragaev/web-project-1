import fs from "fs"
import path from "path"
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LinkedInClient {
  constructor({ email, password, cookieFilePath = path.join(__dirname, ".cookies.json"), debug = false }) {
    this.email = email;
    this.password = password;
    this.cookieFilePath = cookieFilePath;
    this.csrfToken = null;
    this.cookies = null;
    this.debug = debug;

    this.baseUrl = "https://www.linkedin.com/voyager/api";
    this.authUrl = "https://www.linkedin.com/uas/authenticate";
    this.headers = {
      "User-Agent": "LinkedIn/8.8.1 CFNetwork/711.3.18 Darwin/14.0.0",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Li-User-Agent": "LIAuthLibrary:3.2.4 com.linkedin.LinkedIn:8.8.1 iPhone:8.3",
      "X-User-Language": "en",
      "X-User-Locale": "en_US",
    };
  }

  async _loadCookies() {
    if (fs.existsSync(this.cookieFilePath)) {
      const cookieData = JSON.parse(fs.readFileSync(this.cookieFilePath, "utf-8"));
      this.cookies = cookieData.cookies;
      this.csrfToken = cookieData.csrfToken;
      return true;
    }
    return false;
  }

  async _saveCookies(cookies, csrfToken) {
    const data = { cookies, csrfToken };
    fs.writeFileSync(this.cookieFilePath, JSON.stringify(data, null, 2));
    this.cookies = cookies;
    this.csrfToken = csrfToken;
  }

  _parseCookies(headers) {
    const setCookie = headers.raw()?.["set-cookie"];
    if (!setCookie) return null;

    const cookies = setCookie.map((entry) => entry.split(";")[0]);
    const csrfToken = cookies.find((cookie) => cookie.startsWith("JSESSIONID"))?.split("=")[1]?.replace(/"/g, "");
    return { cookies: cookies.join("; "), csrfToken };
  }

  async _initializeSession() {
    const initResponse = await fetch("https://www.linkedin.com/uas/authenticate", {
      method: "GET",
      headers: this.headers,
    });

    if (!initResponse.ok) {
      throw new Error(`Failed to initialize session: ${initResponse.status}`);
    }

    const sessionCookies = this._parseCookies(initResponse.headers);
    if (!sessionCookies || !sessionCookies.csrfToken) {
      console.error("Response Headers (Debug):", initResponse.headers.raw());
      throw new Error("Failed to retrieve CSRF token or session cookies.");
    }

    this.cookies = sessionCookies.cookies;
    this.csrfToken = sessionCookies.csrfToken;
  }

  async _login() {
    console.log("Initializing session...");
    await this._initializeSession();

    const loginPayload = new URLSearchParams({
      session_key: this.email,
      session_password: this.password,
      JSESSIONID: this.csrfToken,
    });

    const response = await fetch(this.authUrl, {
      method: "POST",
      headers: {
        ...this.headers,
        Cookie: this.cookies,
      },
      body: loginPayload,
    });

    if (this.debug) {
      console.log("Login response headers:", response.headers.raw());
    }

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const parsedCookies = this._parseCookies(response.headers);
    if (!parsedCookies || !parsedCookies.csrfToken) {
      throw new Error("Failed to retrieve cookies or CSRF token after login.");
    }

    await this._saveCookies(parsedCookies.cookies, parsedCookies.csrfToken);
  }

  async ensureAuthenticated() {
    if (!(await this._loadCookies())) {
      console.log("No cookies found. Logging in...");
      await this._login();
    }
  }

  async _fetch(endpoint) {
    await this.ensureAuthenticated();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        ...this.headers,
        "csrf-token": this.csrfToken,
        Cookie: this.cookies,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  async getProfile(publicId) {
    return await this._fetch(`/identity/profiles/${publicId}/profileView`);
  }
}

export default LinkedInClient;