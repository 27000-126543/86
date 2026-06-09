/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { db } from './data/database.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import forecastRoutes from './routes/forecast.js'
import purchaseRoutes from './routes/purchase.js'
import kitchenRoutes from './routes/kitchen.js'
import maintenanceRoutes from './routes/maintenance.js'
import logisticsRoutes from './routes/logistics.js'
import inspectionRoutes from './routes/inspection.js'
import recallRoutes from './routes/recall.js'
import membersRoutes from './routes/members.js'
import financeRoutes from './routes/finance.js'
import reportsRoutes from './routes/reports.js'
import systemRoutes from './routes/system.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

setInterval(() => {
  db.refreshRealtimeData()
}, 5000)

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/forecast', forecastRoutes)
app.use('/api/purchase', purchaseRoutes)
app.use('/api/kitchen', kitchenRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/logistics', logisticsRoutes)
app.use('/api/inspection', inspectionRoutes)
app.use('/api/recall', recallRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/system', systemRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
