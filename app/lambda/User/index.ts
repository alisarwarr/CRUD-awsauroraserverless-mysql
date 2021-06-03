import createUser from './createUser';
import deleteUser from './deleteUser';
import allUsers from './allUsers';
import User from './type/User';

type AppSyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        user: User,
        thatId: string
    }
}

exports.handler = async(event: AppSyncEvent) => {
    switch(event.info.fieldName) {
        case "createRestaurant":
            return await createUser(event.arguments.user);

        case "deleteRestaurant":
            return await deleteUser(event.arguments.thatId);

        case "allRestaurants":
            return await allUsers();

        default:
            return null;
    }
}