import { apiRequest, saveSession, updateSessionUser } from './httpClient.js';
import {
  adaptActivity,
  adaptAdoptionPet,
  adaptArticle,
  adaptLostPet,
  adaptModerationItem,
  adaptResponsibleAction,
} from './adapters.js';

export const authApi = {
  async login(credentials) {
    const session = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    saveSession(session);
    return session;
  },

  async register(payload) {
    const session = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    saveSession(session);
    return session;
  },

  async me() {
    const user = await apiRequest('/auth/me');
    updateSessionUser(user);
    return user;
  },

  async updateProfile(payload) {
    const user = await apiRequest('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    updateSessionUser(user);
    return user;
  },
};

export const dashboardApi = {
  async getDashboard() {
    const dashboard = await apiRequest('/dashboard');

    return {
      user: dashboard.user,
      summary: dashboard.summary,
      articles: dashboard.articles.map(adaptArticle),
      activity: dashboard.activity.map(adaptActivity),
    };
  },
};

export const lostPetsApi = {
  async list() {
    const pets = await apiRequest('/lost-pets');
    return pets.map(adaptLostPet);
  },
};

export const adoptionsApi = {
  async list() {
    const pets = await apiRequest('/adoptions');
    return pets.map(adaptAdoptionPet);
  },
};

export const responsibleActionsApi = {
  async list() {
    const actions = await apiRequest('/responsible-actions');
    return actions.map(adaptResponsibleAction);
  },

  async create(payload) {
    const action = await apiRequest('/responsible-actions', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        category: payload.category,
        description: payload.description,
        authorName: payload.author,
      }),
    });

    return adaptResponsibleAction(action);
  },

  async like(id) {
    const action = await apiRequest(`/responsible-actions/${id}/like`, {
      method: 'POST',
    });

    return adaptResponsibleAction(action);
  },
};

export const adminApi = {
  async listModeration() {
    const items = await apiRequest('/admin/moderation');
    return items.map(adaptModerationItem);
  },

  async updateModeration(id, payload) {
    const item = await apiRequest(`/admin/moderation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return adaptModerationItem(item);
  },
};

export const eventsApi = {
  async list() {
    return apiRequest('/events');
  },
};
