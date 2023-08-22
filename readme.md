![imgsuch logo](https://imgsuch.netlify.app/img/apple-touch-icon.png)

# Back-end for the imgsuch social network

imgSuch is a social network app where you can add friends, share stories, images & memories; rate your favorite content and keep in touch with people that you find interesting.

This is the backend of the app, i.e., it handles the requests, routing, authentication & authorization, parsing multipart/form-data, storing images on the server, etc.

# Technologies used

- Node.js
- Express.js
- MongoDB
- Also: multer, sharp

# How to Install and Run the Project

the repo contains all the files that you need to run the project locally, but since the project is public, for security reasons it does NOT contain my credentials

such credentials should be inserted in a config.env file with the following structure:

```
NODE_ENV=development
PORT=3000
DATABASE=(your database link here)
DATABASE_PASSWORD=(your database password here)

JWT_SECRET=(your secret here)
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90 #90days

EMAIL_USERNAME=(your mailtrap username here)
EMAIL_PASSWORD=(your mailtrap password here)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=25
EMAIL_FROM=(your email here)

SENDGRID_USERNAME=apikey
SENDGRID_PASSWORD=(your sendgrid password here)
```

there are two ways to solve this,

1. The easiest way: let me know that you want to deploy your own local version of this app, and I'll share my credentials with you

If you decide to proceed this way, then all you need to do after grabbing the project is:

- create a config.env with a structure similar to what you can see above, and replace with the credentials that I've sent you
- npm run dev

2. the other way to run the project is to:

- [create your own MongoDB deployment](https://www.mongodb.com/)
- [create a mailtrap inbox](https://mailtrap.io/)
- [create a sendgrid inbox](https://sendgrid.com/)

after everything is set up, create a config.env file similar to what's shown above and fill out the necessary credentials with your own

to generate random test data, I've included a simple script that you can run (you can check it out in dev-data/import-dev-data.js):

```
npm run data:import
```

you can also delete all the data from the DB running:

```
npm run data:delete
```

then you can deploy the backend locally running:

```
npm run dev
```

to generate the proper links between fake users and fake stories:

```
Send a GET request to http://127.0.0.1:3000/api/v1/users/checkConsistency
```

if you run into any problems or have any questions, just let me know and I'll be happy to help
