import { Router } from 'express';
import { forecastController } from '../controllers';

const router = Router();

router.get('/', forecastController.getForecast.bind(forecastController));

export default router;
