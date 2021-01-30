const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const passwordValidator = require('password-validator');
const emailValidator = require('email-validator');

const cryptoJs = require('crypto-js');

const User = require('../models/User');

exports.signup = (req, res, next) => {
    const passwordSchema = new passwordValidator();

    passwordSchema
    .is().min(8)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().symbols()
    .has().not().spaces()

    if(passwordSchema.validate(req.body.password) && emailValidator.validate(req.body.email)) {

        require('dotenv').config();
        let encryptEmail = cryptoJs.HmacMD5(req.body.email, process.env.SALT_EMAIL).toString()

        bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: encryptEmail,
                password: hash
            });
            
            user.save()
            .then(() => res.status(201).json({message: 'Utilisateur créé !'}))
            .catch(error => res.status(400).json({error}))
        })
        .catch(error => res.status(500).json({error}))
    } else {
        let message = '';
        if(!passwordSchema.validate(req.body.password)) {
            message = 'Le mot de passe doit être composé de 8 caratères dont au moins : 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial. Les espaces ne sont pas autorisés.'
        } else if(!emailValidator.validate(req.body.email)) {
            message = 'Veuillez saisir une adresse mail valide.'
        }
        res.status(400).json({message})
    }
}

exports.login = (req, res, next) => {

    require('dotenv').config();
    let encryptEmail = cryptoJs.HmacMD5(req.body.email, process.env.SALT_EMAIL).toString()

    User.findOne({ email: encryptEmail })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};