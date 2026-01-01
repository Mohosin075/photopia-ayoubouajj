import cors from 'cors'
import express, { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import path from 'path'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import passport from './app/modules/auth/passport.auth/config/passport'
import router from './routes'
import globalErrorHandler from './app/middleware/globalErrorHandler'
import config from './config'
import webhookApp from './webhook'
import sendResponse from './shared/sendResponse'

const app = express()

// ⚠️ CRITICAL: Webhook MUST be before body parsers to receive raw body
app.use(webhookApp)

// -------------------- Middleware --------------------
// Body parsers must come after webhook
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session must come before passport
app.use(
  session({
    secret: config.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
  }),
)

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// CORS
app.use(
  cors({
    origin: [
      '*',
      'http://10.10.7.13:3001',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://10.10.7.11:5173',
      'http://localhost:60851',
      'http://localhost:5173',
      'https://buddi-script-server.vercel.app',
      'https://buddi-script.vercel.app',
      'https://your-frontend.vercel.app',
    ],
    credentials: true,
  }),
)

// Cookie parser
app.use(cookieParser())

// Logging enabled for troubleshooting
import morgan from 'morgan'
app.use(morgan('dev'))

// -------------------- Static Files --------------------
app.use(express.static('uploads'))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// -------------------- API Routes --------------------

app.use('/api/v1', router)

// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'))
})

router.get('/status', (req: Request, res: Response) => {
  try {
    // You can add more health checks here like:
    // - Database connection status
    // - Memory usage
    // - Other service dependencies

    const healthCheck = {
      success: true,
      message: 'Server is running smoothly',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
    }

    res.status(StatusCodes.OK).json(healthCheck)
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Server is experiencing issues',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// -------------------- Root / Live Response --------------------
app.get('/', (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Welcome to the Gathering API',
    data: {
      timestamp: new Date().toISOString(),
      projectName: 'Gathering',
    },
  })
})

// -------------------- Global Error Handler --------------------
app.use(globalErrorHandler)

// -------------------- 404 Handler --------------------
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Lost, are we?',
    errorMessages: [
      {
        path: req.originalUrl,
        message:
          "Congratulations, you've reached a completely useless API endpoint 👏",
      },
      {
        path: '/docs',
        message: 'Hint: Maybe try reading the docs next time? 📚',
      },
    ],
    roast: '404 brain cells not found. Try harder. 🧠❌',
    timestamp: new Date().toISOString(),
  })
})

export default app
