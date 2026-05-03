import { Router } from 'express';
import { budgetPlanController } from '../controllers';

const router = Router();

router.post('/', budgetPlanController.create.bind(budgetPlanController));
router.get('/', budgetPlanController.findAll.bind(budgetPlanController));
router.get('/:id', budgetPlanController.findOne.bind(budgetPlanController));
router.put('/:id', budgetPlanController.update.bind(budgetPlanController));
router.delete('/:id', budgetPlanController.remove.bind(budgetPlanController));

export default router;