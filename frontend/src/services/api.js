const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class API {
  // Auth helpers
  getToken() {
    return localStorage.getItem('token');
  }

  getAuthHeaders() {
    const token = this.getToken();
    return token ? {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    } : { 'Content-Type': 'application/json' };
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  clearToken() {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Auth
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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
      body: JSON.stringify({ name, email, password, role })
    });
    return response.json();
  }

  async getMe() {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  // Tables (admin-only — all protected)
  async generateTables(numberOfTables) {
    const response = await fetch(`${API_URL}/tables/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ numberOfTables })
    });
    return response.json();
  }

  async getAllTables() {
    const response = await fetch(`${API_URL}/tables`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  async getTableByQR(qrCode) {
    const response = await fetch(`${API_URL}/tables/${qrCode}`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  // Requests (POST is public for clients; others are admin)
  async createRequest(tableNumber, requestType) {
    const response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, requestType })
    });
    return response.json();
  }

  async getPendingRequests() {
    const response = await fetch(`${API_URL}/requests/pending`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  async attendRequest(id) {
    const response = await fetch(`${API_URL}/requests/${id}/attend`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  // Sessions (POST start and GET table are public; close/active are admin)
  async startSession(tableNumber) {
    const response = await fetch(`${API_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber })
    });
    return response.json();
  }

  async getActiveSession(tableNumber) {
    const response = await fetch(`${API_URL}/sessions/table/${tableNumber}`);
    return response.json();
  }

  async getBill(tableNumber) {
    const response = await fetch(`${API_URL}/orders/table/${tableNumber}/bill`);
    return response.json();
  }

  async closeSession(sessionId) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  // Menu (GET is public for client menu; POST/PUT/DELETE are admin)
  async createMenuItem(name, description, price, category) {
    const response = await fetch(`${API_URL}/menu`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name, description, price, category })
    });
    return response.json();
  }

  async getAllMenuItems(category = null) {
    const url = category 
      ? `${API_URL}/menu?category=${category}`
      : `${API_URL}/menu`;
    const response = await fetch(url);
    return response.json();
  }

  async updateMenuItem(id, data) {
    const response = await fetch(`${API_URL}/menu/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async deleteMenuItem(id) {
    const response = await fetch(`${API_URL}/menu/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  // Orders (POST and table GET are public for clients; stats is admin)
  async createOrder(tableNumber, menuItemId, quantity) {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, menuItemId, quantity })
    });
    return response.json();
  }

  async getOrdersByTable(tableNumber) {
    const response = await fetch(`${API_URL}/orders/table/${tableNumber}`);
    return response.json();
  }

  // Stats (admin-only)
  async getRequestStats() {
    const response = await fetch(`${API_URL}/requests/stats`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  async getSalesStats() {
    const response = await fetch(`${API_URL}/orders/stats`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }
}

export default new API();