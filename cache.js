const redis = require('redis');

const client = redis.createClient();
client.set('first', "Testing", 'EX', 4);

let value = client.get('first', function(err, value) {
    console.log(err);
    console.log(value);
    return 'Other Value';
});
console.log('ttfgfd', value);