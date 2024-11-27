import LinkedInClient from "./client.js";

class ClientManager {
  constructor() {
    this.client = null;
  }

  async getClient({ email, password }) {
    if (!this.client) {
      this.client = new LinkedInClient({ email, password, debug: true });
      await this.client.ensureAuthenticated();
    } else {
      await this.client.ensureAuthenticated();
    }
    return this.client;
  }
}

const linkedInClientManager = new ClientManager();

export default linkedInClientManager;