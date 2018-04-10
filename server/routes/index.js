var express = require("express");
var router = express.Router();

var heroService = require("../hero-service");

router.get("/heroes", function(req, res, next) {
  heroService.get(req, res);
});

router.post("/hero", function(req, res, next) {
  heroService.create(req, res);
});

router.put("/hero", function(req, res, next) {
  heroService.update(req, res);
});

router.delete("/hero/:id", function(req, res, next) {
  heroService.remove(req, res);
});

module.exports = router;
