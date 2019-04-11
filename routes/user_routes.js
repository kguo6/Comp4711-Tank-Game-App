const express = require("express");
const router = express.Router();

module.exports = router;

// Import Model
const User = require("../database/models/User");
const collectionUser = "users";
const collectionAchievements = "achievements";

// Create user to track scores
router.post("/track_user", function (request, response) {

    let id = request.body.id;

    // Validate Fields
    if (id == null || id == "") {
        response.status(500).send("ERROR: Unable to Create New User.");
        return;
    }

    // Check If User Already Exists
    let searchUser = {
        id: id
    };

    // Find User in Database
    request.app
        .get("DBO")
        .collection(collectionUser)
        .findOne(searchUser, function (err, result) {
            if (result == null) {
                const newUser = new User(id, 0, []);
                request.app
                    .get("DBO")
                    .collection(collectionUser)
                    .insertOne(newUser, (err, result) => {
                        if (err) {
                            response.status(500).send(err);
                        } else {
                            response.status(200).send(id);
                        }
                    });
            } else {
                response.status(200).send(id);
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
        .findOne(searchUser, function (err, resultUser) {
            if (resultUser != null) {
                response.status(200).jsonp(resultUser.achievements);
            } else {
                response.status(200).jsonp([]);
            }
        });
});

module.exports = router;
