# node-mongodb-es-connector

ElasticSearch and MongoDB sync module for node
![structure]

Supports one-to-one, one-to-many, many-to-one, and many-to-many relationships.

- **one-to-one** - one mongodb collection to one elasticsearch index
- **one-to-many** - one mongodb collection to many elasticsearch indexs
- **many-to-one** - many mongodb collections to one elasticsearch index
- **many-to-many** - many mongodb collections to many elasticsearch indexs

## my current version

    elasticsearch：v5.6.0
    mongodb: v3.2.10
    Nodejs: v8.9.3

## What does it do

node-mongodb-es-connector package keeps your mongoDB collections and elastic search cluster in sync. It does so by tailing the mongo oplog and replicate whatever crud operation into elastic search cluster without any overhead. Please note that a replica set is needed for the package to tail mongoDB.

## How to use

```bash
npm install es-mongodb-sync
```

or Download from GitHub.

## Sample usage

Create a file in the **crawlerDataConfig** folder,the Naming rules is `MongodbServers_port_ElasticsearchServer_port_MongodbDataBase_MongodbCollectionName_ElasticSearchIndexName.json`.

If you have more additional configuration in the `crawlerDataConfig` folder.

For example:

`localhost_29031_localhost_9200_myTest_carts_mycarts.json`

```bash
{
    "mongodb": {
        "mongodb_dataBase": "myTest",
        "mongodb_collectionName": "carts",
        "mongodb_filterQueryFilds": {
            "__v" : 0
        },
        "mongodb_searchReturnFilds": {
            "cName": 1,
            "cPrice": 1,
            "cImgSrc": 1
        },
        "mongodb_defaultValueFilds": {
            "cartTest1": "cartTest111",
            "cartTest2": "cartTest222"
        },
        "mongodb_connection": {
            "mongodb_servers": [
                "localhost:29031"
            ],
            "mongodb_authentication": {
                "userName": "mdAdmin",
                "passWord": "mdPwd",
                "authSource":"admin",
                "replicaSet":"myReplicaSet"
            }
        },
        "mongodb_documentsinBatch": 5000
    },
    "elasticsearch": {
        "elasticsearch_index": "mycarts",
        "elasticsearch_type": "carts",
        "esConnection": {
            "elasticsearch_server": "http://localhost:9200",
            "elasticsearch_httpAuth": {
                "userName": "esAdmin",
                "passWord": "esPwd"
            }
        }
    }
}
```

- **mongodb_dataBase** - MongoDB dataBase to watch.
- **mongodb_collectionName** - MongoDB collection to watch.
- **mongodb_filterQueryFilds** - MongoDB filterQuery,support simple filter.(Default value is `null`)
- **mongodb_searchReturnFilds** - MongoDB need to return to the field.(Default value is `null`)
- **mongodb_defaultValueFilds** - MongoDB expand field.(can default key and value).(Default value is `null`)
- **mongodb_connection**
  - **mongodb_servers** - MongoDB servers.(Array)
  - **mongodb_authentication** - If you do not need to verify the default value is `null`.
    - **userName** - MongoDB connection userName.
    - **passWord** - MongoDB connection passWord.
    - **authSource** - MongoDB user authentication.
    - **replicaSet** - MongoDB replicaSet name.
- **mongodb_data_url** - MongoDB database pull data from.
- **mongodb_documentsinBatch** - An integer that specifies number of documents to send to ElasticSearch in batches. (can be set to very high number.).
- **elasticsearch_index** - ElasticSearch index where documents from watcher collection is saved.
- **elasticsearch_type** - ElasticSearch type given to documents from watcher collection.
- **esConnection**
  - **elasticsearch_server** - URL to a running ElasticSearch cluster.
  - **elasticsearch_httpAuth** - If you do not need to verify the default value is `null`.
    - **userName** - ElasticSearch connection userName.
    - **passWord** - ElasticSearch connection passWord.

## Start up

```bash
node app.js
```

## Result

- **mongodbData**

![mongodb]

- **elasticsearch**

![elasticsearch]

## Extra APIs

index.js

- **Method**
  - **start()** - must start up before all the APIs.
  - **addSingleWatcher()** - add a config json.
  - **updateSingleWatcher()** - update a config json.
  - **deleteSingleWatcher()** - delete a config json.
  - **isExistWatcher()** - check out this config json exist.

## License

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.

[structure]:./test/img/structure.jpg "structure"

[mongodb]:./test/img/mongoDB.jpg "mongodb"

[elasticsearch]:./test/img/elasticsearch.jpg "elasticsearch"