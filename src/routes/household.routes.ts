import { Router } from 'express';
import { householdController } from '../controllers';

const router = Router();

router.post('/', householdController.create.bind(householdController));
router.get('/', householdController.findAll.bind(householdController));
router.get('/:id', householdController.findOne.bind(householdController));
router.put('/:id', householdController.update.bind(householdController));
router.delete('/:id', householdController.remove.bind(householdController));

export default router;