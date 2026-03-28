// Test MongoDB query logic for stale products
const sevenDaysAgo = 7;
const twoDaysAgo = 2;

function buildQuery(search, category, stale) {
    let query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
        query.category = category;
    }
    if (stale) {
        query = {
            ...query,
            $or: [
                { category: 'Oil and Gas', lastUpdated: { $lt: twoDaysAgo } },
                { category: { $ne: 'Oil and Gas' }, lastUpdated: { $lt: sevenDaysAgo } }
            ]
        };
    }
    return query;
}

console.log("Searching for 'Rice' (Stale=true, Category='All'):");
console.log(JSON.stringify(buildQuery('Rice', 'All', true), null, 2));

console.log("\nSearching for 'Rice' (Stale=true, Category='Groceries'):");
console.log(JSON.stringify(buildQuery('Rice', 'Groceries', true), null, 2));

console.log("\nSearching for 'Gas' (Stale=true, Category='Oil and Gas'):");
console.log(JSON.stringify(buildQuery('Gas', 'Oil and Gas', true), null, 2));
