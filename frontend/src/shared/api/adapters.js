export function adaptLostPet(pet) {
  return {
    id: pet.id,
    ownerId: pet.ownerId,
    ownerName: pet.ownerName,
    ownerAvatarUrl: pet.ownerAvatarUrl,
    name: pet.name,
    type: pet.type,
    breed: pet.breed,
    sex: pet.sex,
    size: pet.size,
    zone: pet.zone,
    status: pet.status,
    contact: pet.contact ?? pet.contactName,
    contactPhone: pet.contactPhone,
    lastSeen: pet.lastSeen,
    description: pet.description,
    image: pet.image ?? pet.imageUrl,
    images: pet.images ?? [pet.image ?? pet.imageUrl].filter(Boolean),
    moderationStatus: pet.moderationStatus,
    rejectionReason: pet.rejectionReason,
    createdAt: pet.createdAt,
  };
}

export function adaptAdoptionPet(pet) {
  return {
    id: pet.id,
    ownerId: pet.ownerId,
    ownerName: pet.ownerName,
    ownerAvatarUrl: pet.ownerAvatarUrl,
    name: pet.name,
    type: pet.type,
    age: pet.age,
    breed: pet.breed,
    sex: pet.sex,
    status: pet.status === 'En adopcion' ? 'En adopción' : pet.status,
    contact: pet.contact ?? pet.contactName,
    contactPhone: pet.contactPhone,
    personality: pet.personality,
    description: pet.description,
    image: pet.image ?? pet.imageUrl,
    images: pet.images ?? [pet.image ?? pet.imageUrl].filter(Boolean),
    vaccinated: pet.vaccinated,
    sterilized: pet.sterilized,
    moderationStatus: pet.moderationStatus,
    rejectionReason: pet.rejectionReason,
    createdAt: pet.createdAt,
  };
}

export function adaptArticle(article) {
  return {
    id: article.id,
    category: article.category,
    title: article.title,
    description: article.description,
    content: article.content,
    image: article.image ?? article.imageUrl,
    sources: article.sources ?? [],
    published: article.published,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

export function adaptActivity(item) {
  const iconByType = {
    adoption: 'heart',
    article: 'bookmark',
    event: 'calendar',
    lost_pet: 'heart',
    responsible_action: 'heart',
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
    ownerId: action.ownerId,
    title: action.title,
    author: action.author ?? action.authorName,
    category: action.category,
    points: action.points,
    minPoints: action.minPoints,
    maxPoints: action.maxPoints,
    scoringReason: action.scoringReason,
    likes: action.likes,
    description: action.description,
    actionDate: action.actionDate,
    location: action.location,
    evidenceUrl: action.evidenceUrl,
    moderationStatus: action.moderationStatus,
    rejectionReason: action.rejectionReason,
    createdAt: action.createdAt,
    reviewedAt: action.reviewedAt,
  };
}

export function adaptModerationItem(item) {
  return {
    id: item.id,
    title: item.title,
    owner: item.owner ?? item.ownerName,
    ownerEmail: item.ownerEmail,
    status: item.status,
    type: item.type,
    typeLabel: item.typeLabel,
    description: item.description,
    ownerId: item.ownerId,
    category: item.category,
    evidenceUrl: item.evidenceUrl,
    minPoints: item.minPoints,
    maxPoints: item.maxPoints,
    monthlyLimit: item.monthlyLimit,
    createdAt: item.createdAt,
  };
}
