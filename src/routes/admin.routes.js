import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import { isAdmin } from '../middlewares/auth.js';
import {
  renderAdminPanel,
  createGroup,
  deleteGroup,
  createUser,
  deleteUser
} from '../controllers/admin.controller.js';

const router = Router();

// Proteger panel solo para administradores
router.use(isAdmin);

router.get('/', renderAdminPanel);
router.post('/groups', createGroup);
router.post('/groups/delete/:id', deleteGroup);
router.post('/users', upload.single('photo'), createUser);
router.post('/users/delete/:id', deleteUser);

export default router;