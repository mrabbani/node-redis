const store = require('./RedisStore');
const Repository = require('./CacheRepository');

const cache = new Repository(store);

async function get() {
    cache.put('test', 12, 1060);

    let value = await cache.get('test', 'ter');
    let value1 = await cache.get('test1', 'ter');
    console.log('result value ', value)
    console.log('r1esult value ', value1)
    console.log('r1esult value ', value1)
    console.log('key value ', await cache.has('test'));
}
get();