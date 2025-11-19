"use strict";

module.exports = {
  up: (models, mongoose) => {
    return models.users.insertMany([
      {
        _id: "63592f9e29fa6431e563fe04",
        name: "admin",
        email: "admin@demo.com",
        secrets: {
          password: "$2a$12$dj49mQ1i0K4r35Idgi77seSWUqAkFmgvYZq1SXf5mhcV.w6xzUqVq",
        },
        type: "63592f9e29fa6431e563fe01"
      }
    ])
      .then((res) => {
        console.log(`Seeding Successful`);
      });
  },

  down: (models, mongoose) => {
    return models.users.deleteMany({
      _id: {
        $in: [
          "63592f9e29fa6431e563fe04"
        ],
      },
    }).then((res) => {
      console.log(`Rollback Successful`);
    });
  },
};
