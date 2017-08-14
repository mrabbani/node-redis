const store = require('./RedisStore');
const Repository = require('./CacheRepository');

const cache = new Repository(store);

cache.put('test', 12, 10);

let value = cache.get('test', 'ter');

console.log(value);

value.then((val) => {});