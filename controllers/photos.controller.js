const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const { find } = require('../models/photo.model');


/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const {
      title,
      author,
      email
    } = req.fields;
    const file = req.files.file;

    function validateEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
  }


    if (title && author && validateEmail(email) && file) { // if fields are not empty...
      const fileName = file.path.split('/').slice(-1)[0];
      const fileExtension = file.path.split('.').slice(-1)[0];

      const permittedExtensions = ['jpg', 'png', 'gif'];
      const index = permittedExtensions.indexOf(fileExtension);

      if(index >= 0) {
        if(title.length <= 25 && author.length <= 50) {

          function escape(html) {
            return html.replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;")
          }

          const newPhoto = new Photo({
            title: escape(title),
            author: escape(author),
            email: escape(email),
            src: escape(fileName),
            votes: 0
          });
    
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);

        } else {
          throw new Error('Check number of characters');
        }

      } else {
        throw new Error('Wrong file extension');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {

    const findIp = await Voter.findOne({user: res.connection.remoteAddress});
    
    if(findIp == null) {
        const newVoter = new Voter({
            user: res.connection.remoteAddress,
            votes: req.params.id,
        })

        await newVoter.save();
        res.json(newVoter);
    } else {
        const findPhoto = await Voter.findOne({votes: {$in: [Object(req.params.id)]}});
        if(findPhoto == null) {
            await Voter.updateOne({user: res.connection.remoteAddress}, {$push: {votes: req.params.id}})
        } else {
            throw new Error('You have already voted for this picture');
        }
    }


    const photoToUpdate = await Photo.findOne({
      _id: req.params.id
    });


    if (!photoToUpdate) res.status(404).json({
      message: 'Not found'
    });
    else {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({
        message: 'OK'
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }

};