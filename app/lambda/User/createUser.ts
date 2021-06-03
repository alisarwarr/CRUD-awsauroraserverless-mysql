const dbcarn = process.env.CLUSTER_ARN || '';
const dbsarn = process.env.SECRET_ARN || '';
const dbname = process.env.DATABASE_NAME || '';
import User from './type/User';


//require and initialize data-api-client
const data = require('data-api-client')({
  secretArn: dbsarn,
  resourceArn: dbcarn,
  database: dbname
});


async function createUser(user: User) {

    try {
        //creating query
        await data.query(
            //creating a table
            `
                CREATE TABLE IF NOT EXISTS users (
                    id INT NOT NULL AUTO_INCREMENT,
                    name TEXT NOT NULL,
                    PRIMARY KEY (id)
                )
            `
        );


        //creating query
        await data.query(
            //inserting data into a table
            `
                INSERT INTO users (name, address, cuisine)
                VALUES ('${user.name}')
            `
        );


        return user;
    }
    catch(err) {
        console.log('ERROR', err);
        return null;
    }
}

export default createUser;
