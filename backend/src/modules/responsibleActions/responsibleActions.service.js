import { createRecord, list, updateRecord } from '../../data/store.js';

export function getActions({ query, category } = {}) {
  return list('responsibleActions').filter((action) => {
    const matchesQuery = query
      ? `${action.title} ${action.authorName} ${action.category}`.toLowerCase().includes(query.toLowerCase())
      : true;
    const matchesCategory = category
      ? action.category.toLowerCase() === category.toLowerCase()
      : true;

    return matchesQuery && matchesCategory;
  });
}

export function createAction(payload, user) {
  return createRecord('responsibleActions', {
    title: payload.title,
    category: payload.category,
    description: payload.description,
    authorName: payload.authorName ?? user.name,
    points: Number(payload.points ?? 30),
    likes: 0,
    createdBy: user.id,
  });
}

export function likeAction(id) {
  const action = list('responsibleActions').find((item) => item.id === id);

  if (!action) {
    return null;
  }

  return updateRecord('responsibleActions', id, { likes: action.likes + 1 });
}

