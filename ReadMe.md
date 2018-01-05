# node-mongodb-es-connector

ElasticSearch and MongoDB sync module for node

## What does it do

node-mongodb-es-connector package keeps your mongoDB collections and elastic search cluster in sync. It does so by tailing the mongo oplog and replicate whatever crud operation into elastic search cluster without any overhead. Please note that a replica set is needed for the package to tail mongoDB.

## How to use

```bash
npm install es-mongodb-sync
```

## Sample usage

Create a file in the `crawlerDataConfig` folder,the Naming rules is `Mongodb_CollectionName`_`ElasticSearch_IndexName`.

If you have more additional configuration in the `crawlerDataConfig` folder.

For example:

`carts_mycarts.json`

```bash
{
    "mongodb":{
        "mongodb_collectionName": "carts",
        "mongodb_filterQueryFilds":{
            "__v" : 0
        },
        "mongodb_searchReturnFilds": {
            "cName": 1,
            "cPrice": 1,
            "cImgSrc": 1
        },
        "mongodb_defaultValueFilds":{
            "cartTest1":"cartTest111",
            "cartTest2":"cartTest222"
        },
        "mongodb_oplog_url":"mongodb://localhost:29031/local",
        "mongodb_data_url":"mongodb://localhost:29031/myTest",
        "mongodb_documentsinBatch":5000
    },
    "elasticsearch":{
        "elasticsearch_index": "mycarts",
        "elasticsearch_type": "carts",
        "elasticsearch_url":"http://localhost:9200"
    }
}
```

- **mongodb_collectionName** - MongoDB collection to watch.
- **mongodb_filterQueryFilds** - MongoDB filterQuery,support simple filter.
- **mongodb_searchReturnFilds** - MongoDB need to return to the field.
- **mongodb_defaultValueFilds** - MongoDB expand field.(can default key and value).
- **mongodb_oplog_url** - MongoDB database to tail from.
- **mongodb_data_url** - MongoDB database pull data from.
- **mongodb_documentsinBatch** - An integer that specifies number of documents to send to ElasticSearch in batches. (can be set to very high number.).
- **elasticsearch_index** - ElasticSearch index where documents from watcher collection is saved.
- **elasticsearch_type** - ElasticSearch type given to documents from watcher collection.
- **elasticsearch_url** - URL to a running ElasticSearch cluster.

## Start up

```bash
node app.js
```

## Extra APIs

Next release.

## License

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.