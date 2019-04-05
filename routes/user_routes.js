const express = require("express");
const router = express.Router();

module.exports = router;

// Import Model
const User = require("../database/models/User");
const collectionUser = "users";
const collectionAchievements = "achievements";

// UPDATE USER WHEN GAME ENDS
router.post("/update", (request, response) => {
  let id = request.body.id;
  let kills = parseInt(request.body.kills);

  let achievements = [];

  // Search Criteria for User
  let searchUser = {
    id: id
  };

  request.app
    .get("DBO")
    .collection(collectionUser)
    .findOne(searchUser, function(err, resultUser) {
      if (resultUser != null) {
        let searchAchievements = {
          kills: { $lte: resultUser.kills + kills }
        };
        request.app
          .get("DBO")
          .collection(collectionAchievements)
          .find(searchAchievements)
          .toArray((err, resultAchievements) => {
            if (err) response.status(500).send(err);
            let values = {
              $set: {
                kills: resultUser.kills + kills,
                achievements: resultAchievements
              }
            };
            request.app
              .get("DBO")
              .collection(collectionUser)
              .updateOne(resultUser, values, (err, result) => {
                if (err) {
                  response.status(500).send(err);
                } else {
                  response.status(200).send("User Successfully Updated.");
                }
              });
          });
      }
    });
});

// RETRIEVE USER ACHIEVEMENTS
router.get("/achievements", (request, response) => {
  let id = request.query.id;

  // Search Criteria for User
  let searchUser = {
    id: id
  };

  // Search for User
  request.app
    .get("DBO")
    .collection(collectionUser)
    .findOne(searchUser, function(err, resultUser) {
      if (resultUser != null) {
        response.status(200).jsonp(resultUser.achievements);
      } else {
        response.status(200).jsonp([]);
      }
    });
});

module.exports = router;
