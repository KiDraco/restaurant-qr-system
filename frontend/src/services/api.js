const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class API {
  getAuthHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  async isAuthenticated() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Auth
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return response.json();
  }

  async register(name, email, password, role, adminSecret) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret
      },
      body: JSON.stringify({ name, email, password, role }),
      credentials: 'include'
    });
    return response.json();
  }

  async getMe() {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  // Tables (admin-only — all protected)
  async generateTables(numberOfTables) {
    const response = await fetch(`${API_URL}/tables/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ numberOfTables }),
      credentials: 'include'
    });
    return response.json();
  }

  async getAllTables() {
    const response = await fetch(`${API_URL}/tables`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  async getTableByQR(qrCode) {
    const response = await fetch(`${API_URL}/tables/${qrCode}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  // Requests (POST is public for clients; others are admin)
  async createRequest(tableNumber, requestType) {
    const response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, requestType }),
      credentials: 'include'
    });
    return response.json();
  }

  async getPendingRequests() {
    const response = await fetch(`${API_URL}/requests/pending`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  async attendRequest(id) {
    const response = await fetch(`${API_URL}/requests/${id}/attend`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  // Sessions (POST start and GET table are public; close/active are admin)
  async startSession(tableNumber) {
    const response = await fetch(`${API_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber }),
      credentials: 'include'
    });
    return response.json();
  }

  async getActiveSession(tableNumber) {
    const response = await fetch(`${API_URL}/sessions/table/${tableNumber}`, {
      credentials: 'include'
    });
    return response.json();
  }

  async getBill(tableNumber) {
    const response = await fetch(`${API_URL}/orders/table/${tableNumber}/bill`, {
      credentials: 'include'
    });
    return response.json();
  }

  async closeSession(sessionId) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  // Menu (GET is public for client menu; POST/PUT/DELETE are admin)
  async createMenuItem(name, description, price, category, image_url) {
    const response = await fetch(`${API_URL}/menu`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name, description, price, category, image_url }),
      credentials: 'include'
    });
    return response.json();
  }

  async getAllMenuItems(category = null) {
    const url = category 
      ? `${API_URL}/menu?category=${category}`
      : `${API_URL}/menu`;
    const response = await fetch(url, {
      credentials: 'include'
    });
    return response.json();
  }

  async updateMenuItem(id, data) {
    const response = await fetch(`${API_URL}/menu/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async deleteMenuItem(id) {
    const response = await fetch(`${API_URL}/menu/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  // Orders (POST and table GET are public for clients; stats is admin)
  async createOrder(tableNumber, menuItemId, quantity) {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, menuItemId, quantity }),
      credentials: 'include'
    });
    return response.json();
  }

  async getOrdersByTable(tableNumber) {
    const response = await fetch(`${API_URL}/orders/table/${tableNumber}`, {
      credentials: 'include'
    });
    return response.json();
  }

  // Stats (admin-only)
  async getActiveSessions() {
    const response = await fetch(`${API_URL}/sessions/active`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  async getRequestStats() {
    const response = await fetch(`${API_URL}/requests/stats`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  async getSalesStats() {
    const response = await fetch(`${API_URL}/orders/stats`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  // Menu import from Excel
  async importMenuParse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        try {
          const response = await fetch(`${API_URL}/menu/import/parse`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ fileBase64: base64 }),
            credentials: 'include'
          });
          resolve(response.json());
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async importMenuConfirm(mapping, rows) {
    const response = await fetch(`${API_URL}/menu/import/confirm`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mapping, rows }),
      credentials: 'include'
    });
    return response.json();
  }

  // Promotions (admin CRUD)
  async getActivePromotions() {
    const response = await fetch(`${API_URL}/promotions/active`, {
      credentials: 'include'
    });
    return response.json();
  }

  async getAllPromotions() {
    const response = await fetch(`${API_URL}/promotions`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }

  async createPromotion(name, description, discount_percentage, image_url, start_date, end_date) {
    const response = await fetch(`${API_URL}/promotions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name, description, discount_percentage, image_url, start_date, end_date }),
      credentials: 'include'
    });
    return response.json();
  }

  async updatePromotion(id, data) {
    const response = await fetch(`${API_URL}/promotions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return response.json();
  }

  async deletePromotion(id) {
    const response = await fetch(`${API_URL}/promotions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });
    return response.json();
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new API();
