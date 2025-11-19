const config = {
    "development": {
        "database": {
            "url": process.env.MONGODB_URI,
            "options": {
                "useNewUrlParser": true,
                "dbName": process.env.MONGODB_NAME
            }
        }
    },
    "test": {
        "database": {
            "url": process.env.MONGODB_URI,
            "options": {
                "useNewUrlParser": true,
                "dbName": process.env.MONGODB_NAME
            }
        }
    },
    "production": {
        "database": {
            "url": process.env.MONGODB_URI,
            "options": {
                "useNewUrlParser": true,
                "dbName": process.env.MONGODB_NAME
            }
        }
    }
}

export default config;