/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const TicketsController = () => import('#controllers/tickets_controller')

router.get('/', [TicketsController, 'index'])
router.get('/dashboard', [TicketsController, 'dashboard'])
