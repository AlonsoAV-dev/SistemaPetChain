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

  async updatePassword(payload) {
    return apiRequest('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
    return (await apiRequest('/lost-pets')).map(adaptLostPet);
  },
  async mine() {
    return (await apiRequest('/lost-pets/mine')).map(adaptLostPet);
  },
  async get(id) {
    return adaptLostPet(await apiRequest(`/lost-pets/${id}`));
  },
  async create(payload) {
    return adaptLostPet(await apiRequest('/lost-pets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  },
  async update(id, payload) {
    return adaptLostPet(await apiRequest(`/lost-pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  },
  async remove(id) {
    return apiRequest(`/lost-pets/${id}`, { method: 'DELETE' });
  },
};

export const adoptionsApi = {
  async list() {
    return (await apiRequest('/adoptions')).map(adaptAdoptionPet);
  },
  async mine() {
    return (await apiRequest('/adoptions/mine')).map(adaptAdoptionPet);
  },
  async get(id) {
    return adaptAdoptionPet(await apiRequest(`/adoptions/${id}`));
  },
  async create(payload) {
    return adaptAdoptionPet(await apiRequest('/adoptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  },
  async update(id, payload) {
    return adaptAdoptionPet(await apiRequest(`/adoptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  },
  async remove(id) {
    return apiRequest(`/adoptions/${id}`, { method: 'DELETE' });
  },
};

export const responsibleActionsApi = {
  async list() {
    return (await apiRequest('/responsible-actions')).map(adaptResponsibleAction);
  },
  async mine() {
    return (await apiRequest('/responsible-actions/mine')).map(adaptResponsibleAction);
  },
  async rewards() {
    return apiRequest('/responsible-actions/rewards');
  },
  async get(id) {
    return adaptResponsibleAction(await apiRequest(`/responsible-actions/${id}`));
  },
  async create(payload) {
    return adaptResponsibleAction(await apiRequest('/responsible-actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  },
  async update(id, payload) {
    return adaptResponsibleAction(await apiRequest(`/responsible-actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  },
  async remove(id) {
    return apiRequest(`/responsible-actions/${id}`, { method: 'DELETE' });
  },
  async like(id) {
    return adaptResponsibleAction(await apiRequest(`/responsible-actions/${id}/like`, {
      method: 'POST',
    }));
  },
};

export const commentsApi = {
  async list(publicationId) {
    return apiRequest(`/comments/publication/${publicationId}`);
  },
  async create(publicationId, body) {
    return apiRequest(`/comments/publication/${publicationId}`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },
  async update(id, body) {
    return apiRequest(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    });
  },
  async remove(id) {
    return apiRequest(`/comments/${id}`, { method: 'DELETE' });
  },
};

export const adminApi = {
  async getSummary() {
    return apiRequest('/admin/summary');
  },
  async listModeration() {
    return (await apiRequest('/admin/moderation')).map(adaptModerationItem);
  },
  async updateModeration(id, payload) {
    return adaptModerationItem(await apiRequest(`/admin/moderation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  },
  async listPublications(params = {}) {
    const search = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value),
    ).toString();
    return apiRequest(`/admin/publications${search ? `?${search}` : ''}`);
  },
  async listComments() {
    return apiRequest('/admin/comments');
  },
  async deleteComment(id) {
    return apiRequest(`/admin/comments/${id}`, { method: 'DELETE' });
  },
  async listUsers() {
    return apiRequest('/admin/users');
  },
  async createUser(payload) {
    return apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateUserStatus(id, status) {
    return apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  async listRewards() {
    return apiRequest('/admin/rewards');
  },
  async updateReward(id, payload) {
    return apiRequest(`/admin/rewards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async drawReward(id) {
    return apiRequest(`/admin/rewards/${id}/draw`, { method: 'POST' });
  },
};

export const eventsApi = {
  async list() {
    return apiRequest('/events');
  },
  async get(id) {
    return apiRequest(`/events/${id}`);
  },
  async create(payload) {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async attend(id) {
    return apiRequest(`/events/${id}/attend`, { method: 'POST' });
  },
};

export const articlesApi = {
  async list(category = '', options = {}) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (options.all) params.set('all', 'true');
    const search = params.toString() ? `?${params.toString()}` : '';
    return (await apiRequest(`/articles${search}`)).map(adaptArticle);
  },
  async get(id) {
    return adaptArticle(await apiRequest(`/articles/${id}`));
  },
  async create(payload) {
    return adaptArticle(await apiRequest('/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  },
  async update(id, payload) {
    return adaptArticle(await apiRequest(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }));
  },
  async remove(id) {
    return apiRequest(`/articles/${id}`, { method: 'DELETE' });
  },
};

export const mediaApi = {
  async uploadImage(file, folder = 'publications') {
    const body = new FormData();
    body.append('image', file);
    body.append('folder', folder);
    return apiRequest('/media/images', {
      method: 'POST',
      body,
    });
  },
};

export const interactionsApi = {
  async notifications() {
    return apiRequest('/interactions/notifications');
  },
  async markNotificationRead(id) {
    return apiRequest(`/interactions/notifications/${id}/read`, { method: 'PATCH' });
  },
  async createAdoptionRequest(publicationId, payload) {
    return apiRequest(`/interactions/adoptions/${publicationId}/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async listAdoptionRequests(publicationId) {
    return apiRequest(`/interactions/adoptions/${publicationId}/requests`);
  },
  async updateAdoptionRequest(id, status) {
    return apiRequest(`/interactions/adoption-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  async createLostPetReport(publicationId, payload) {
    return apiRequest(`/interactions/lost-pets/${publicationId}/reports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async listLostPetReports(publicationId) {
    return apiRequest(`/interactions/lost-pets/${publicationId}/reports`);
  },
  async updateLostPetReport(id, status) {
    return apiRequest(`/interactions/lost-pet-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
