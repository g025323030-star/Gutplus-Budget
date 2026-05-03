import { Router } from 'express';
import { familyMemberController } from '../controllers';

const router = Router();

router.post('/', familyMemberController.create.bind(familyMemberController));
router.get('/', familyMemberController.findAll.bind(familyMemberController));
router.get('/:id', familyMemberController.findOne.bind(familyMemberController));
router.put('/:id', familyMemberController.update.bind(familyMemberController));
router.delete('/:id', familyMemberController.remove.bind(familyMemberController));

export default router;