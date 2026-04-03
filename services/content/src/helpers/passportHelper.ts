import passport from "passport";
import { Strategy as JwtStrategy} from "passport-jwt"
import { NextFunction, Request } from "express";
import dotenv from 'dotenv'
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import dynamodbClient from "../services/dynamodbService";
import { returnError } from "./errorHelper";

dotenv.config()

const cookieExtractor = (req: Request) => {
    let token = null
    if (req && req.cookies) {
        token = req.cookies['__Secure-auth.access']
    }
    return token
}

const opts: any = {}

opts.jwtFromRequest = cookieExtractor
opts.secretOrKey = String(process.env.SECURE_AUTH_SECRET)


passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    try{

        const params = {
            TableName: "AHCOM",
            Key: {
                PK: {S: `USER#${jwt_payload.sub}`},
                SK: {S: `PROFILE#${jwt_payload.sub}`}
            }
        }

        const userGetItemCommand = new GetItemCommand(params)

        const userQueryResult = await dynamodbClient.send(userGetItemCommand)

        if (userQueryResult.Item === undefined) {
            const customError = returnError("User Error", 401, {msg:"Invalid User", code:"INVALID_USER"})
            return done(customError, false)
        }
        return done(null, {id: String(userQueryResult.Item.PK.S).split("#")[1], email: userQueryResult.Item?.email.S})
    } catch(error) {
        return done(error, false)
    }
}))

export const passportAuthenticate = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate('jwt', {session: false}, (err: any, user: any, info: any) => {
            if (info instanceof Error){
                const customError = returnError("Unauthorized", 401, {msg:"Invalid User", code:"INVALID_AUTH"})
                return next(customError)
            }
            if (err || !user) {
                return next(err)
            }
            req.user = user
            return next()
        })(req, res, next)
    }
}