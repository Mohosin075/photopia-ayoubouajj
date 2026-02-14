import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Secret } from 'jsonwebtoken'
import config from '../../config'
import { jwtHelper } from '../../helpers/jwtHelper'
import ApiError from '../../errors/ApiError'
import { error } from 'console'

const auth =
  (...roles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tokenWithBearer = req.headers.authorization

        if (!tokenWithBearer) {
          return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token not found!'))
        }

        if (!tokenWithBearer.startsWith('Bearer')) {
          return next(
            new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token format'),
          )
        }

        const token = tokenWithBearer.split(' ')[1]

        if (!token) {
          return next(
            new ApiError(StatusCodes.UNAUTHORIZED, 'Token missing after Bearer'),
          )
        }

        let verifyUser

        // FIRST: decode token
        try {
          verifyUser = jwtHelper.verifyToken(
            token,
            config.jwt.jwt_secret as Secret,
          )
          console.log({verifyUser})
          // Ensure userId is present even for older tokens
          if (!verifyUser.userId && verifyUser.authId) {
            verifyUser.userId = verifyUser.authId
          }
          // Normalize role fields for compatibility across token versions
          if ((verifyUser as any).activeRole && !(verifyUser as any).role) {
            ;(verifyUser as any).role = (verifyUser as any).activeRole
          }
          if ((verifyUser as any).role && !(verifyUser as any).activeRole) {
            ;(verifyUser as any).activeRole = (verifyUser as any).role
          }
        } catch (error: any) {
          if (error.name === 'TokenExpiredError') {
            return next(
              new ApiError(StatusCodes.UNAUTHORIZED, 'Access Token has expired'),
            )
          }

          return next(new ApiError(StatusCodes.FORBIDDEN, 'Invalid Access Token'))
        }


        // Attach to req
        req.user = verifyUser

        // SECOND: role check
        if (roles.length > 0) {
          const userRole =
            verifyUser.activeRole ||
            verifyUser.role ||
            (verifyUser as any).user?.role ||
            (verifyUser as any).data?.role

          if (!userRole) {
            return next(
              new ApiError(StatusCodes.FORBIDDEN, 'User role missing in token'),
            )
          }

          console.log({userRole})

          if (!roles.includes(userRole)) {
            return next(
              new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have permission to access this API",
              ),
            )
          }
        }

        // SUCCESS
        return next()
      } catch (error) {
        return next(error)
      }
    }

export default auth

//this temp auth middleware is created for temporary user verification before creating a new user
//in the future, we will use the auth middleware above

export const tempAuth =
  (...roles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tokenWithBearer = req.headers.authorization

        if (!tokenWithBearer) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Token not found!')
        }

        if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
          const token = tokenWithBearer.split(' ')[1]


          try {
            // Verify token
            const verifyUser = jwtHelper.verifyToken(
              token,
              config.jwt.temp_jwt_secret as Secret,
            )


            // Set user to header
            req.user = verifyUser

            // Guard user
            if (roles.length && !roles.includes(verifyUser.activeRole || verifyUser.role)) {
              throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have permission to access this API",
              )
            }

            next()
          } catch (error) {
            if (error instanceof Error && error.name === 'TokenExpiredError') {
              throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                'Access Token has expired',
              )
            }
            next(error)
            throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid Access Token')
          }
        }
      } catch (error) {
        next(error)
      }
    }
