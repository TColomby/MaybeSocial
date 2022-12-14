const Post = require('../models/sauces');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( error )})
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
  console.log(sauceObject);

  delete sauceObject._userId;
  Sauce.findOne({_id: req.params.id})
      .then((sauce) => {
            console.log(sauce);
          if (sauce.userId != req.auth.userId) {
              res.status(403).json({ message : 'Not authorized'});
          } else {
              Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
              console.log(sauce);
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
      .then(sauce => {
          if (sauce.userId != req.auth.userId) {
              res.status(403).json({message: 'Not authorized'});
          } else {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Sauce.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
      .then(Sauce=> res.status(200).json(Sauce))
      .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce =  (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(Sauce => res.status(200).json(Sauce))
      
      
      .catch(error => res.status(404).json({ error }));
}

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            // user sans like/dislike pour la sauce selectionnée
            if(sauce.usersDisliked.indexOf(req.body.userId) == -1 && sauce.usersLiked.indexOf(req.body.userId) == -1) {
                if(req.body.like == 1) { //user like
                    sauce.usersLiked.push(req.body.userId);
                    sauce.likes += req.body.like;
                } else if(req.body.like == -1) { // user dislike
                    sauce.usersDisliked.push(req.body.userId);
                    sauce.dislikes -= req.body.like;
                };
            };
            // user annule like
            if(sauce.usersLiked.indexOf(req.body.userId) != -1 && req.body.like == 0) {
                const likesUserIndex = sauce.usersLiked.findIndex(user => user === req.body.userId);
                sauce.usersLiked.splice(likesUserIndex, 1);
                sauce.likes -= 1;
            };
            // user annule dislike
            if(sauce.usersDisliked.indexOf(req.body.userId) != -1 && req.body.like == 0) {
                const likesUserIndex = sauce.usersDisliked.findIndex(user => user === req.body.userId);
                sauce.usersDisliked.splice(likesUserIndex, 1);
                sauce.dislikes -= 1;
            }
            sauce.save();
            res.status(201).json({ message: 'OK' });
        })
        .catch(error => res.status(500).json({ error }));
};