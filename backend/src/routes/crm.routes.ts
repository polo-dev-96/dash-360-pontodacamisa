import { Request, Response, Router } from 'express';
import crmService from '../services/crm.service';

const router = Router();

router.get('/funil', async (req: Request, res: Response) => {
  console.log('[CRM API] GET /funil chamado às', new Date().toLocaleTimeString('pt-BR'));
  try {
    const minPecas = req.query.minPecas ? parseInt(req.query.minPecas as string, 10) : undefined;
    const data = await crmService.getResumoFunilCRM(minPecas);
    res.json(data);
  } catch (error) {
    console.error('[CRM API] Erro ao buscar funil:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do funil CRM' });
  }
});

export default router;
