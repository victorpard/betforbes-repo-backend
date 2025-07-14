import { Router } from 'express'
import withdrawService from './withdraw.service'
import { authenticateToken } from '../../middlewares/auth'

const router = Router()

// POST /api/withdraw
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const { amount } = req.body
    // Chama o método correto do serviço:
    const result = await withdrawService.withdraw(userId, amount)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

export default router
