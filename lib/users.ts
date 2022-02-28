import * as mongodb from 'mongodb'

import * as connect from '../lib/connect'

export interface User {
    name : String,
    email : String,
    password : String,
    suppIdeas ?: Array<mongodb.ObjectId>,
    unsuppIdeas ?: Array<mongodb.ObjectId>,
    _id ?: mongodb.ObjectId
}

interface Result {
    status : Boolean,
    message : String,
}

let users : mongodb.Collection<User>

export function setup() : Promise<Boolean> {

    return connect.setup().then(db => {
        users = db.collection('users')
        return true
    })
}

export function registration(data) : Promise<ResultWithID> | Promise<Result> {
    let rezult : Result = {
        status : true,
        message : ""
    }
    if(!(!!data && !!data.name && !!data.email && !!data.password)){
        rezult.status = false
        rezult.message = "Wrong name or password"
        return Promise.resolve(rezult).then(() => {
            return rezult
        })
    }
    
    return addUser(data)
}

export type ResultWithID = Result & {
    userid : mongodb.ObjectId
}

export function addUser(data) : Promise<ResultWithID> {
    let rezult : ResultWithID = {
        status : true,
        message : "",
        userid : null
    }
    return users.findOne({ email: data.email })
        .then(userCheck => {
            if (userCheck) {
                rezult.status = false
                rezult.message = "There is already user with the same mail"
                return rezult
            }
            const user = { name: data.name, email: data.email, password: data.password, suppIdeas: [], unsuppIdeas: [] }
            return users.insertOne(user)
                .then(result => {
                    rezult.status = true
                    rezult.message = "User registration"
                    rezult.userid = result.insertedId
                    return rezult
                })
        })
}

export type ResultWithUser = Result & {
    user : User
}

export function signin(data) : Promise<ResultWithUser> {
    let rezult : ResultWithUser = {
        status : true,
        message : "",
        user : null
    }

    if(data.email == "" || data.password == ""){
        rezult.status = false
        rezult.message = "Wrong email or password"
    }
    
    return users.findOne({email : data.email, password : data.password})
    .then(user => {
        if(!user){
            rezult.status = false
            rezult.message = "Can't find user"
        }
        else{
            rezult.status = true
            rezult.message = "Signin is successful"
            rezult.user = user
        }
        return rezult
    })
}

export function findIdeasSupport(mail, ideaid) : Promise<Boolean> {
    return users.findOne({email : mail,
        suppIdeas : {$all : [new mongodb.ObjectId(ideaid)]}
    })
    .then(rezult => {
        return !!rezult
    })
}

export function findIdeasUnsupport(mail, ideaid) : Promise<Boolean> {
    return users.findOne({email : mail,
        unsuppIdeas : {$all : [new mongodb.ObjectId(ideaid)]}
    })
    .then(rezult => {
        return !!rezult // преобразование в логическое значение
    })
}

export function pushSupport(mail, ideaid) : Promise<Boolean> {
    return users.findOneAndUpdate(
        {email : mail},
        {$push : {suppIdeas : new mongodb.ObjectId(ideaid)}})
        .then(rezult => {
            return true
        })
}

export function pushUnsupport(mail, ideaid) : Promise<Boolean> {
    return users.findOneAndUpdate(
        {email : mail},
        {$push : {unsuppIdeas : new mongodb.ObjectId(ideaid)}})
        .then(rezult => {
            return true
        })
}

export function pullSupport(mail, ideaid) : Promise<Boolean> {
    return users.findOneAndUpdate(
        {email : mail},
        {$pull : {suppIdeas : new mongodb.ObjectId(ideaid)}})
        .then(rezult => {
            return true
        })
}

export function pullUnsupport(mail, ideaid) : Promise<Boolean> {
    return users.findOneAndUpdate(
        {email : mail},
        {$pull : {unsuppIdeas : new mongodb.ObjectId(ideaid)}})
        .then(rezult => {
            return true
        })
}

export function getAllUsers() : Promise<User[]> {
    return users
        .find()
        .sort( {support : -1} ) // сортирует массив по призаку (1 - по возрастанию, -1 - по убыванию)
        .toArray()
}

export function getUserByEmail(mail) : Promise<User> {
    return users.findOne({email : mail})
}

export function clearUsers() {
    return users.deleteMany({})
}
