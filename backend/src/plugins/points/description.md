Backend (backend/src/plugins/points/)
model.ts – model pentru puncte (CRUD rewards, getUserBalance, addPoints, spendPoints)
service.ts – applyAtCheckout(), deductPointsInTransaction(), awardOnDelivery()
hooks.ts – onOrderDelivered() pentru comenzi livrate
admin/controller.ts – CRUD pentru pragmatic de puncte
graphql/schema.ts – extensie schema cu PointsReward și pointsRewards
graphql/resolvers.ts – resolver pentru pointsRewards
email.ts – sendPointsEarnedEmail()
index.ts – pointsPlugin cu registerAdminRoutes(), service, hooks, resolvers, schemaExtension
Integrări:
Order.create apelează pointsPlugin.service.applyAtCheckout() și deductPointsInTransaction()
admin/controllers/orders.ts apelează pointsPlugin.hooks.onOrderDelivered() în loc de logica inline
Router admin: pointsPlugin.registerAdminRoutes(router)
Schema GraphQL: extensie din plugin
