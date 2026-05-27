import { list, updateRecord } from '../../data/store.js';
import { httpError } from '../../utils/httpError.js';

export function getModerationItems() {
  return list('moderationItems');
}

export function updateModerationItem(id, payload) {
  const updatedItem = updateRecord('moderationItems', id, payload);

  if (!updatedItem) {
    throw httpError(404, 'Elemento de moderacion no encontrado.');
  }

  return updatedItem;
}

