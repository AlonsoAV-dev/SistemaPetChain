export function adaptLostPet(pet) {
  return {
    id: pet.id,
    name: pet.name,
    type: pet.type,
    zone: pet.zone,
    status: pet.status,
    contact: pet.contact ?? pet.contactName,
    lastSeen: pet.lastSeen,
    description: pet.description,
    image: pet.image ?? pet.imageUrl,
  };
}

export function adaptAdoptionPet(pet) {
  return {
    id: pet.id,
    name: pet.name,
    type: pet.type,
    age: pet.age,
    vaccines: pet.vaccines,
    status: pet.status === 'En adopcion' ? 'En adopción' : pet.status,
    contact: pet.contact ?? pet.contactName,
    personality: pet.personality,
    image: pet.image ?? pet.imageUrl,
  };
}

export function adaptArticle(article) {
  return {
    id: article.id,
    category: article.category,
    title: article.title,
    description: article.description,
    image: article.image ?? article.imageUrl,
  };
}

export function adaptActivity(item) {
  const iconByType = {
    adoption: 'heart',
    article: 'bookmark',
    event: 'calendar',
    lost_pet: 'heart',
  };

  return {
    id: item.id,
    icon: item.icon ?? iconByType[item.type] ?? 'heart',
    title: item.title,
    date: item.date ?? item.dateLabel,
  };
}

export function adaptResponsibleAction(action) {
  return {
    id: action.id,
    title: action.title,
    author: action.author ?? action.authorName,
    category: action.category,
    points: action.points,
    likes: action.likes,
    description: action.description,
  };
}

export function adaptModerationItem(item) {
  return {
    id: item.id,
    title: item.title,
    owner: item.owner ?? item.ownerName,
    status: item.status,
    type: item.type,
  };
}

