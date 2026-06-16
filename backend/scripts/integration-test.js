import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { pool, query } from '../src/config/database.js';
import * as adminService from '../src/modules/admin/admin.service.js';
import * as authService from '../src/modules/auth/auth.service.js';
import * as adoptionsService from '../src/modules/adoptions/adoptions.service.js';
import * as articlesService from '../src/modules/articles/articles.service.js';
import * as eventsService from '../src/modules/events/events.service.js';
import * as interactionsService from '../src/modules/interactions/interactions.service.js';
import * as lostPetsService from '../src/modules/lostPets/lostPets.service.js';
import * as actionsService from '../src/modules/responsibleActions/responsibleActions.service.js';
import * as commentsService from '../src/modules/comments/comments.service.js';
import { verifyToken } from '../src/utils/token.js';

const suffix = Date.now();
let admin;
let user;
let otherUser;
let adminCreatedUser;
let adminCreatedAdmin;
let createdEvent;
let server;

try {
  const adminRegistration = await authService.register({
    name: 'Admin Test',
    email: `admin-${suffix}@example.com`,
    password: 'AdminTest123',
  });
  admin = adminRegistration.user;

  await query(`UPDATE public.users SET role = 'admin' WHERE id = $1`, [admin.id]);
  const adminSession = await authService.login({
    email: admin.email,
    password: 'AdminTest123',
  });
  admin = adminSession.user;
  assert.equal(admin.role, 'admin');
  assert.equal(verifyToken(adminSession.token).sub, admin.id);

  const userSession = await authService.register({
    name: 'User Test',
    email: `user-${suffix}@example.com`,
    password: 'UserTest123',
  });
  user = userSession.user;

  otherUser = (
    await authService.register({
      name: 'Other Test',
      email: `other-${suffix}@example.com`,
      password: 'OtherTest123',
    })
  ).user;

  adminCreatedUser = await adminService.createUser({
    name: 'Created User Test',
    email: `created-user-${suffix}@example.com`,
    password: 'CreatedUser123',
    role: 'user',
  });
  assert.equal(adminCreatedUser.role, 'user');

  adminCreatedAdmin = await adminService.createUser({
    name: 'Created Admin Test',
    email: `created-admin-${suffix}@example.com`,
    password: 'CreatedAdmin123',
    role: 'admin',
  });
  assert.equal(adminCreatedAdmin.role, 'admin');

  const articles = await articlesService.getArticles();
  assert.equal(articles.length > 0, true);
  const articleDetail = await articlesService.getArticle(articles[0].id);
  assert.equal(articleDetail.id, articles[0].id);

  createdEvent = await eventsService.createEvent(
    {
      title: 'Live comunitario de integracion',
      description: 'Evento de prueba para validar asistencia y enlaces externos.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Instagram Live',
      capacity: 25,
      externalUrl: 'https://www.instagram.com/',
    },
    admin,
  );
  assert.equal(createdEvent.externalUrl, 'https://www.instagram.com/');
  const attendedEvent = await eventsService.registerAttendance(createdEvent.id, user);
  assert.equal(attendedEvent.isRegistered, true);
  assert.equal(attendedEvent.participants >= 1, true);

  const publicActionsBefore = (await actionsService.getActions()).length;
  const action = await actionsService.createAction(
    {
      title: 'Limpieza comunitaria',
      category: 'Medio ambiente',
      description: 'Limpieza del parque y apoyo a mascotas de la zona.',
    },
    user,
  );
  assert.equal(action.moderationStatus, 'pending');
  assert.equal((await actionsService.getActions()).length, publicActionsBefore);

  const queue = await adminService.getModerationItems();
  assert.equal(queue.some((item) => item.id === action.id), true);

  const approved = await adminService.updateModerationItem(
    action.id,
    { status: 'Aprobado' },
    admin.id,
  );
  assert.equal(approved.status, 'Aprobado');
  assert.equal((await actionsService.getActions()).length, publicActionsBefore + 1);

  const comment = await commentsService.createComment(
    action.id,
    { body: 'Comentario de integracion.' },
    otherUser,
  );
  assert.equal((await commentsService.listComments(action.id)).length, 1);
  assert.equal((await adminService.listComments()).some((item) => item.id === comment.id), true);

  await assert.rejects(
    actionsService.updateAction(action.id, { title: 'Edicion ajena' }, otherUser),
    /no pertenece/i,
  );

  const edited = await actionsService.updateAction(
    action.id,
    { description: 'Contenido actualizado por el propietario y sujeto a nueva revision.' },
    user,
  );
  assert.equal(edited.moderationStatus, 'pending');
  assert.equal((await actionsService.getActions()).length, publicActionsBefore);

  await adminService.updateModerationItem(action.id, { status: 'Aprobado' }, admin.id);

  const points = await query(
    `SELECT count(*)::integer AS transactions, sum(points)::integer AS points
     FROM public.point_transactions
     WHERE publication_id = $1`,
    [action.id],
  );
  assert.equal(points.rows[0].transactions, 1);

  const adoption = await adoptionsService.createAdoptionPet(
    {
      name: 'Nala Test',
      type: 'Perro',
      age: '2 años',
      breed: 'Mestiza',
      sex: 'Hembra',
      personality: 'Sociable y tranquila.',
      description: 'Mascota de prueba para validar el flujo completo de adopcion.',
      contactPhone: '999111222',
      imageUrls: ['https://example.com/nala-test.jpg'],
    },
    user,
  );
  await adminService.updateModerationItem(adoption.id, { status: 'Aprobado' }, admin.id);
  await assert.rejects(
    adoptionsService.updateAdoptionPet(adoption.id, { name: 'Edicion ajena' }, otherUser),
    /no pertenece/i,
  );
  const editedAdoption = await adoptionsService.updateAdoptionPet(
    adoption.id,
    { description: 'Historia actualizada por la persona responsable de la adopcion.' },
    user,
  );
  assert.equal(editedAdoption.moderationStatus, 'pending');
  await adminService.updateModerationItem(adoption.id, { status: 'Aprobado' }, admin.id);
  const adoptionRequest = await interactionsService.createAdoptionRequest(
    adoption.id,
    {
      phone: '999333444',
      city: 'Lima',
      housing: 'Casa propia',
      message: 'Deseo ofrecerle un hogar estable y responsable.',
    },
    otherUser,
  );
  assert.equal(adoptionRequest.status, 'pending');
  assert.equal((await interactionsService.listAdoptionRequests(adoption.id, user)).length, 1);
  await interactionsService.updateAdoptionRequest(adoptionRequest.id, 'contacted', user);

  const lostPet = await lostPetsService.createLostPet(
    {
      name: 'Rocky Test',
      type: 'Perro',
      zone: 'Miraflores',
      lastSeen: new Date().toISOString(),
      description: 'Perro de prueba con collar rojo y una mancha blanca.',
      contactPhone: '999555666',
      imageUrls: ['https://example.com/rocky-test.jpg'],
    },
    user,
  );
  await adminService.updateModerationItem(lostPet.id, { status: 'Aprobado' }, admin.id);
  await assert.rejects(
    lostPetsService.updateLostPet(lostPet.id, { name: 'Edicion ajena' }, otherUser),
    /no pertenece/i,
  );
  const editedLostPet = await lostPetsService.updateLostPet(
    lostPet.id,
    { description: 'Descripcion actualizada por la persona responsable del reporte.' },
    user,
  );
  assert.equal(editedLostPet.moderationStatus, 'pending');
  await adminService.updateModerationItem(lostPet.id, { status: 'Aprobado' }, admin.id);
  const sighting = await interactionsService.createLostPetReport(
    lostPet.id,
    {
      reportType: 'sighting',
      location: 'Parque Kennedy',
      seenAt: new Date().toISOString(),
      description: 'Lo vi caminando cerca de la entrada principal del parque.',
      contactPhone: '999777888',
      evidenceUrls: ['https://example.com/rocky-evidence.jpg'],
    },
    otherUser,
  );
  assert.equal(sighting.status, 'pending');
  assert.equal((await interactionsService.listLostPetReports(lostPet.id, user)).length, 1);
  assert.equal((await interactionsService.listNotifications(user.id)).length >= 2, true);

  const adminPublication = await adoptionsService.createAdoptionPet(
    {
      name: 'Publicacion Admin',
      type: 'Gato',
      age: '1 año',
      personality: 'Tranquilo y sociable.',
      description: 'Publicacion creada por administracion y aprobada automaticamente.',
      contactPhone: '999000111',
      imageUrls: ['https://example.com/admin-adoption.jpg'],
    },
    admin,
  );
  assert.equal(adminPublication.moderationStatus, 'approved');
  assert.equal(points.rows[0].points, 20);

  const adminSummary = await adminService.getSummary();
  assert.equal(adminSummary.comments >= 1, true);
  assert.equal((await adminService.listPublications()).some((item) => item.id === action.id), true);

  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  const anonymousDashboard = await fetch(`${baseUrl}/dashboard`);
  assert.equal(anonymousDashboard.status, 401);

  const authenticatedDashboard = await fetch(`${baseUrl}/dashboard`, {
    headers: { Authorization: `Bearer ${userSession.token}` },
  });
  assert.equal(authenticatedDashboard.status, 200);

  const forbiddenAdmin = await fetch(`${baseUrl}/admin/moderation`, {
    headers: { Authorization: `Bearer ${userSession.token}` },
  });
  assert.equal(forbiddenAdmin.status, 403);

  const forbiddenAdminEdit = await fetch(`${baseUrl}/responsible-actions/${action.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'El admin no debe editar' }),
  });
  assert.equal(forbiddenAdminEdit.status, 404);

  console.log('Backend integration test passed');
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (createdEvent?.id) {
    await query(`DELETE FROM public.events WHERE id = $1`, [createdEvent.id]);
  }
  const regularUserIds = [user?.id, otherUser?.id, adminCreatedUser?.id].filter(Boolean);
  if (regularUserIds.length > 0) {
    await query(`DELETE FROM public.users WHERE id = ANY($1::uuid[])`, [regularUserIds]);
  }
  const adminIds = [admin?.id, adminCreatedAdmin?.id].filter(Boolean);
  if (adminIds.length > 0) {
    await query(`DELETE FROM public.users WHERE id = ANY($1::uuid[])`, [adminIds]);
  }
  await pool.end();
}
