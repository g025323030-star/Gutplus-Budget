import { Router } from 'express';
import { accountController } from '../controllers';

const router = Router();

router.post('/', accountController.create.bind(accountController));
router.get('/', accountController.findAll.bind(accountController));
router.get('/:id', accountController.findOne.bind(accountController));
router.put('/:id', accountController.update.bind(accountController));
router.delete('/:id', accountController.remove.bind(accountController));

export default router;