const dbcarn = process.env.CLUSTER_ARN || '';
const dbsarn = process.env.SECRET_ARN || '';
const dbname = process.env.DATABASE_NAME || '';


//require and initialize data-api-client
const data = require('data-api-client')({
  secretArn: dbsarn,
  resourceArn: dbcarn,
  database: dbname
});


async function deleteUser(thatId: string) {

    try {
        //creating query
        await data.query(
            //delete that specific id's data of a table
            `
                DELETE FROM users WHERE id=${thatId}
            `
        );

        return thatId;
    }
    catch(err) {
        console.log('ERROR', err);
        return null;
    }
}

export default deleteUser;