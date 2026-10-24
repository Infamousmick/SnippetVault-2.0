const mongoose = require("mongoose")
const pc= require("picocolors")

const databaseConnectionString = process.env.MONGO_URI

const initDatabaseConnection = async() => {
    try {
        await mongoose.connect(databaseConnectionString)
        console.log(pc.green("✅ Database connected successfully"))
    }catch(e)
    {
        console.log(pc.red("❌ Db connection error"))
        process.exit(1)
    }
}

module.exports = initDatabaseConnection