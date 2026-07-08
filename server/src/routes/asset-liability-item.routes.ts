import { Router } from 'express';
import {
  createAssetLiabilityItemSchema,
  updateAssetLiabilityItemSchema,
} from '@gutplus/shared';
import { assetLiabilityItemController } from '../controllers';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Specific sub-routes before /:id to avoid param conflicts
router.get('/debt-overview', assetLiabilityItemController.findDebtOverview.bind(assetLiabilityItemController));

router.post(
  '/',
  validate(createAssetLiabilityItemSchema),
  assetLiabilityItemController.create.bind(assetLiabilityItemController),
);
router.get('/', assetLiabilityItemController.findAll.bind(assetLiabilityItemController));
router.get('/:id', assetLiabilityItemController.findOne.bind(assetLiabilityItemController));
router.put(
  '/:id',
  validate(updateAssetLiabilityItemSchema),
  assetLiabilityItemController.update.bind(assetLiabilityItemController),
);
router.delete('/:id/with-expense', assetLiabilityItemController.removeWithBudgetItem.bind(assetLiabilityItemController));
router.delete('/:id', assetLiabilityItemController.remove.bind(assetLiabilityItemController));

export default router;
