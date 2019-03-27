const axios = require('axios');
const express = require('express');
const router  = express.Router();

// Comp4711 #random slack channel
const PROJECT_RANDOM_CHANNEL = 'TGMV1NF0F/BHCE0NALX/jXJvs84XmnjsWAORxoXHOMQ4';

// Post to slack channel route
router.post('/postslack', (req, res) => {
    
    if (req.body.username == null
        || req.body.username == undefined
        || req.body.username == ''
        || req.body.score == null
        || req.body.score == undefined) {
        res.status(500).send('ERROR: Invalid username/score');
    }

    let username = req.body.username;
    let score = req.body.score;

    axios.post(`https://hooks.slack.com/services/${PROJECT_RANDOM_CHANNEL}`, {
        // TODO: update to production url
        text: `${username} just got a high score of ${score}! Think you can beat them? Join the fight at http://kennyguo.com/static/`
    })
    .then((result) => {
        if (result.status != 200) {
            console.log(result.status, result);
            res.status(result.status).send(result.statusText);
        } else {
            res.status(200).send(result.statusText);
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(error);
    });
});

module.exports = router;
