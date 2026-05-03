import { Router } from 'express';
import { categoryController } from '../controllers';

const router = Router();

router.post('/', categoryController.create.bind(categoryController));
router.get('/', categoryController.findAll.bind(categoryController));
router.get('/:id', categoryController.findOne.bind(categoryController));
router.put('/:id', categoryController.update.bind(categoryController));
router.delete('/:id', categoryController.remove.bind(categoryController));

export default router;