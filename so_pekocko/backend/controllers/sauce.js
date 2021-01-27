const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({error}))
};

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({error}))
};

exports.createdSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce)
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    })

    sauce.save()
        .then(() => res.status(201).json({
            message: 'Sauce enregistrée !'
        }))
        .catch(error => res.status(400).json({
            error
        }))
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body }

    Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({
            message: 'Sauce modifiée !'
        }))
        .catch(error => res.status(400).json({
            error
        }))
};

exports.deleteSauce = (req, res, next) => {

    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({
                        message: 'Sauce supprimée !'
                    }))
                    .catch(error => res.status(400).json({
                        error
                    }))
            })
        })
        .catch(error => res.status(400).json({
            error
        }))
};

exports.likeDislike = (req, res, next) => {
    const like = req.body.like
    const userId = req.body.userId

    const sauceId = req.params.id

    let params = '';
    let message = '';

    let reset = false;

    switch(like) {
        case 1:
            params = { $push: 
                { usersLiked: userId },
                $inc: { likes: +1 }
            }
            message = "Like enregistré !"
        break;
        case -1:
            params = { $push: 
                { usersDisliked: userId },
                $inc: { dislikes: +1 }
            }
            message = "Dislike enregistré !"
        break;
        case 0:
            reset = true;
            Sauce.findOne({_id: sauceId})
                .then(sauce => {
                    if(sauce.usersLiked.includes(userId)) {
                        params = {
                            $pull: {
                                usersLiked: userId
                            },
                            $inc: {
                                likes: -1
                            }
                        }
                        message = 'Like supprimé !'
                    }

                    if(sauce.usersDisliked.includes(userId)) {
                        params = {
                            $pull: {
                                usersDisliked: userId
                            },
                            $inc: {
                                dislikes: -1
                            }
                        }
                        message = 'Disike supprimé !'
                    }

                    Sauce.updateOne({ _id: sauceId }, params)
                        .then(() => res.status(200).json({ message }))
                        .catch(error => res.status(400).json({ error }))
                })
                .catch(error => {
                    res.status(404).json({error})
                })
        break;
    }

    if(!reset) {
        Sauce.updateOne({ _id: sauceId }, params)
        .then(() => res.status(200).json({message}))
        .catch(error => res.status(400).json({error}))
    }
};