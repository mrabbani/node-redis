class Repository {


    constructor(store) {
        this.store = store;
    }

    /**
     * Determine if an item exists in the cache.
     *
     * @param  string  key
     * @return bool
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Retrieve an item from the cache by key.
     *
     * @param  string  key
     * @param  mixed   defaultValue
     * @return mixed
     */
    get(key, defaultValue = null) {
        if (Array.isArray(key)) {
            return this.many(key);
        }

        let value = this.store.get(this.itemKey(key));

        // If we could not find the cache value, we will fire the missed event and get
        // the defaultValue value for this cache value. This defaultValue could be a callback
        // so we will execute the value function which will resolve it if needed.
        if (value === null) {
            // this.event(new CacheMissed(key));

            value = defaultValue;
        } else {
            // this.event(new CacheHit(key, value));
        }

        return value;
    }

    /**
     * Retrieve multiple items from the cache by key.
     *
     * Items not found in the cache will have a null value.
     *
     * @param  array  keys
     * @return Object
     */
    many(keys) {
        let values = this.store.many(keys);

        values.map(function(value, key) {
            return this.handleManyResult(keys, key, value);
        });

        return values;
    }

    /**
     * Handle a result for the "many" method.
     *
     * @param  array  keys
     * @param  string  key
     * @param  mixed  value
     * @return mixed
     */
    handleManyResult(keys, key, value) {
        // If we could not find the cache value, we will fire the missed event and get
        // the defaultValue value for this cache value. This defaultValue could be a callback
        // so we will execute the value function which will resolve it if needed.
        if (value === null) {
            this.event(new CacheMissed(key));

            // return isset(keys[key]) ? value(keys[key]) : null;
            return null;
        }

        // If we found a valid value we will fire the "hit" event and return the value
        // back from this function. The "hit" event gives developers an opportunity
        // to listen for every possible cache "hit" throughout this applications.
        this.event(new CacheHit(key, value));

        return value;
    }

    /**
     * Retrieve an item from the cache and delete it.
     *
     * @param  string  key
     * @param  mixed   defaultValue
     * @return mixed
     */
    pull(key, defaultValue = null) {
        value = this.get(key, defaultValue);
        this.forget(key);

        return value;
    }

    /**
     * Store an item in the cache.
     *
     * @param  string  key
     * @param  mixed   value
     * @param  \DateTime|float|int  minutes
     * @return void
     */
    put(key, value, minutes = null) {
        if (Array.isArray(key)) {
            return this.putMany(key, value);
        }

        if ((minutes = this.getMinutes(minutes)) !== null) {
            this.store.put(this.itemKey(key), value, minutes);

            // this.event(new KeyWritten(key, value, minutes));
        }
    }

    /**
     * Store multiple items in the cache for a given number of minutes.
     *
     * @param  array  values
     * @param  float|int  minutes
     * @return void
     */
    putMany(values, minutes) {

        values.forEach((value, key) => {
            this.put(key, value, minutes);
            // this.event(new KeyWritten(key, value, minutes));
        });
    }

    /**
     * Store an item in the cache if the key does not exist.
     *
     * @param  string  key
     * @param  mixed   value
     * @param  \DateTime|float|int  minutes
     * @return bool
     */
    add(key, value, minutes) {
        if (is_null(minutes = this.getMinutes(minutes))) {
            return false;
        }

        // If the store has an "add" method we will call the method on the store so it
        // has a chance to override this logic. Some drivers better support the way
        // this operation should work with a total "atomic" implementation of it.
        if (typeof this.store.add === 'function') {

            return this.store.add(this.itemKey(key), value, minutes);
        }

        // If the value did not exist in the cache, we will put the value in the cache
        // so it exists for subsequent requests. Then, we will return true so it is
        // easy to know if the value gets added. Otherwise, we will return false.
        if (this.get(key) === null) {
            this.put(key, value, minutes);

            return true;
        }

        return false;
    }

    /**
     * Increment the value of an item in the cache.
     *
     * @param  string  key
     * @param  mixed  value
     * @return int|bool
     */
    increment(key, value = 1) {
        return this.store.increment(key, value);
    }

    /**
     * Decrement the value of an item in the cache.
     *
     * @param  string  key
     * @param  mixed  value
     * @return int|bool
     */
    decrement(key, value = 1) {
        return this.store.decrement(key, value);
    }

    /**
     * Store an item in the cache indefinitely.
     *
     * @param  string  key
     * @param  mixed   value
     * @return void
     */
    forever(key, value) {
        this.store.forever(this.itemKey(key), value);

        // this.event(new KeyWritten(key, value, 0));
    }

    /**
     * Get an item from the cache, or store the defaultValue value.
     *
     * @param  string  key
     * @param  \DateTime|float|int  minutes
     * @param  \Closure  callback
     * @return mixed
     */
    remember(key, minutes, callback) {
        let value = this.get(key);

        // If the item exists in the cache we will just return this immediately and if
        // not we will execute the given Closure and cache the result of that for a
        // given number of minutes so it's available for all subsequent requests.
        if (value !== null) {
            return value;
        }

        this.put(key, value = callback(), minutes);

        return value;
    }

    /**
     * Get an item from the cache, or store the defaultValue value forever.
     *
     * @param  string   key
     * @param  \Closure  callback
     * @return mixed
     */
    sear(key, callback) {
        return this.rememberForever(key, callback);
    }

    /**
     * Get an item from the cache, or store the defaultValue value forever.
     *
     * @param  string   key
     * @param  \Closure  callback
     * @return mixed
     */
    rememberForever(key, callback) {
        let value = this.get(key);

        // If the item exists in the cache we will just return this immediately and if
        // not we will execute the given Closure and cache the result of that for a
        // given number of minutes so it's available for all subsequent requests.
        if (value !== null) {
            return value;
        }

        this.forever(key, value = callback());

        return value;
    }

    /**
     * Remove an item from the cache.
     *
     * @param  string  key
     * @return bool
     */
    forget(key) {
        return this.store.forget(this.itemKey(key));
    }


    /**
     * Format the key for a cache item.
     *
     * @param  string  key
     * @return string
     */
    itemKey(key) {
        return key;
    }

    /**
     * Get the defaultValue cache time.
     *
     * @return float|int
     */
    getDefaultValueCacheTime() {
        return this.defaultValue;
    }

    /**
     * Set the defaultValue cache time in minutes.
     *
     * @param  float|int  minutes
     * @return this
     */
    setDefaultValueCacheTime(minutes) {
        this.defaultValue = minutes;

        return this;
    }

    /**
     * Get the cache store implementation.
     *
     * @return \Illuminate\Contracts\Cache\Store
     */
    getStore() {
        return this.store;
    }

    /**
     * Fire an event for this cache instance.
     *
     * @param  string  event
     * @return void
     */
    // event(event) {
    //     if (isset(this.events)) {
    //         this.events - > dispatch(event);
    //     }
    // }


    /**
     * Determine if a cached value exists.
     *
     * @param  string  key
     * @return bool
     */
    offsetExists(key) {
        return this.has(key);
    }

    /**
     * Retrieve an item from the cache by key.
     *
     * @param  string  key
     * @return mixed
     */
    offsetGet(key) {
        return this.get(key);
    }

    /**
     * Store an item in the cache for the defaultValue time.
     *
     * @param  string  key
     * @param  mixed   value
     * @return void
     */
    offsetSet(key, value) {
        this.put(key, value, this.defaultValue);
    }

    /**
     * Remove an item from the cache.
     *
     * @param  string  key
     * @return void
     */
    offsetUnset(key) {
        this.forget(key);
    }

    /**
     * Calculate the number of minutes with the given duration.
     *
     * @param  \DateTime|float|int  duration
     * @return float|int|null
     */
    getMinutes(duration) {
        // if (duration instanceof DateTime) {
        //     // duration = Carbon::now() - > diffInSeconds(Carbon::instance(duration), false) / 60;
        // }

        // return (int)(duration * 60) > 0 ? duration : null;

        return duration * 60;
    }

}

module.exports = Repository;