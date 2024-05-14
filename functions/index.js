/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.storePostData = onRequest((request, response) => {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(function () {
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(function (error) {
        response.status(500).json({ error });
      });
  });
});
