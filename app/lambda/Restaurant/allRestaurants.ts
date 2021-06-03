const dbcarn = process.env.CLUSTER_ARN || '';
const dbsarn = process.env.SECRET_ARN || '';
const dbname = process.env.DATABASE_NAME || '';


//require and initialize data-api-client
const data = require('data-api-client')({
  secretArn: dbsarn,
  resourceArn: dbcarn,
  database: dbname
});


async function allRestaurants() {

    try {
        let result;

        //creating query
        result = await data.query(
            //select all data from a table
            `
                SELECT * FROM restaurants
            `
        );

        return result.records;
    }
    catch(err) {
        console.log('ERROR', err);
        return null;
    }
}

export default allRestaurants;