import { Router } from 'express';
import { userController } from '../controllers';

const router = Router();


router.get(
  '/check-email',
  userController.checkEmailExists.bind(userController),
);

// router.post('/', userController.create.bind(userController));
// router.get('/', userController.findAll.bind(userController));
// router.get('/:id', userController.findOne.bind(userController));
// router.put('/:id', userController.update.bind(userController));
// router.delete('/:id', userController.remove.bind(userController));

export default router;