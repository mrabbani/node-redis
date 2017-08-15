const Redis = require('ioredis');

let redis = new Redis({
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 0
});


class RedisStore {
    get(key) {
        return redis.get(key);
    }

    set(key, value, seconds) {
        redis.set(key, value, 'EX', seconds)
    }

    put(key, value, seconds) {
        this.set(key, value, seconds);
    }

    forget(key) {
        redis.del(key);
    }

    forever(key, value) {
        redis.set(key, value);
    }

    many(keys) {
        let original = {};

        // keys.forEach((value, index) => {
        //     original = {...original, [value]: index };
        // });

        return original;
    }
}

let store = new RedisStore();

module.exports = store;