const Hero = require("./hero-model");
const ReadPreference = require("mongodb").ReadPreference;

require("./mongo").connect();

function get(req, res) {
  const docquery = Hero.find({}).read(ReadPreference.NEAREST);
  docquery
    .exec()
    .then(heroes => {
      res.json(heroes);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

function create(req, res) {
  const hero = new Hero({
    id: req.body.id,
    name: req.body.name,
    saying: req.body.saying
  });

  hero
    .save()
    .then(() => {
      res.json(hero);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

function update(req, res) {
  Hero.findOne({ id: req.params.id })
    .then(hero => {
      hero.name = req.body.name;
      hero.saying = req.body.saying;
      return hero.save();
    })
    .then(hero => {
      res.json(hero);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

function remove(req, res) {
  Hero.findOneAndRemove({ id: req.body.params })
    .then(hero => {
      res.status(204).send(hero);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

module.exports = {
  get,
  create,
  update,
  remove
};
