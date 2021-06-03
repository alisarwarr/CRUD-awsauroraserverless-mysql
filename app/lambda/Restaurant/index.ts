import createRestaurant from './createRestaurant';
import deleteRestaurant from './deleteRestaurant';
import allRestaurants from './allRestaurants';
import Restaurant from './type/Restaurant';

type AppSyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        restaurant: Restaurant,
        thatId: string
    }
}

exports.handler = async(event: AppSyncEvent) => {
    switch(event.info.fieldName) {
        case "createRestaurant":
            return await createRestaurant(event.arguments.restaurant);

        case "deleteRestaurant":
            return await deleteRestaurant(event.arguments.thatId);

        case "allRestaurants":
            return await allRestaurants();

        default:
            return null;
    }
}