const dbcarn = process.env.CLUSTER_ARN || '';
const dbsarn = process.env.SECRET_ARN || '';
const dbname = process.env.DATABASE_NAME || '';
import Restaurant from './type/Restaurant';


//require and initialize data-api-client
const data = require('data-api-client')({
  secretArn: dbsarn,
  resourceArn: dbcarn,
  database: dbname
});


async function createRestaurant(restaurant: Restaurant) {

    try {
        //creating query
        await data.query(
            //creating a table
            `
                CREATE TABLE IF NOT EXISTS restaurants (
                    id INT NOT NULL AUTO_INCREMENT,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    cuisine TEXT NOT NULL,
                    PRIMARY KEY (id)
                )
            `
        );


        //creating query
        await data.query(
            //inserting data into a table
            `
                INSERT INTO restaurants (name, address, cuisine)
                VALUES ('${restaurant.name}', '${restaurant.address}', '${restaurant.cuisine}')
            `
        );


        return restaurant;
    }
    catch(err) {
        console.log('ERROR', err);
        return null;
    }
}

export default createRestaurant;
