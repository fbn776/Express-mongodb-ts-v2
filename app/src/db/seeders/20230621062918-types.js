"use strict";

module.exports = {
  up: (models, mongoose) => {
    return models.user_types.insertMany([
      {
        "_id": "63592f9e29fa6431e563fe01",
        "title": "admin",
        "type_id": 1
      },
      {
        "_id": "63592f9e29fa6431e563fe02",
        "title": "user",
        "type_id": 2
      },
      {
        "_id": "63592f9e29fa6431e563fe03",
        "title": "agent",
        "type_id": 3
      }
    ])
      .then((res) => {
        console.log(`Seeding Successful`);
      });
  },

  down: (models, mongoose) => {
    return models.user_types.deleteMany({
      _id: {
        $in: [
          "63592f9e29fa6431e563fe01",
          "63592f9e29fa6431e563fe02",
          "63592f9e29fa6431e563fe03",
        ],
      },
    }).then((res) => {
      console.log(`Rollback Successful`);
    });
  },
};
