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

Create a file in the **crawlerDataConfig** folder,the Naming rules is `MongodbDataBase_MongodbCollectionName_ElasticSearchIndexName`.

If you have more additional configuration in the `crawlerDataConfig` folder.

The File directory structure

`|--crawlerDataConfig`</br>
&nbsp;&nbsp;`|--mongodbServers_port`</br>
&nbsp;&nbsp;&nbsp;&nbsp;`|--elasticsearchServer_port`</br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`|--MongodbDataBase_MongodbCollectionName_ElasticSearchIndexName`

For example:

`|--crawlerDataConfig`</br>
&nbsp;&nbsp;`|--localhost_29031`</br>
&nbsp;&nbsp;&nbsp;&nbsp;`|--localhost_9200`</br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`|--myTest_carts_mycarts.json`

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
                "passWord": "mdPwd"
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
- **mongodb_filterQueryFilds** - MongoDB filterQuery,support simple filter.
- **mongodb_searchReturnFilds** - MongoDB need to return to the field.
- **mongodb_defaultValueFilds** - MongoDB expand field.(can default key and value).
- **mongodb_connection**
  - **mongodb_servers** - MongoDB servers.
  - **mongodb_authentication**
    - **userName** - MongoDB connection userName.
    - **passWord** - MongoDB connection passWord.
- **mongodb_data_url** - MongoDB database pull data from.
- **mongodb_documentsinBatch** - An integer that specifies number of documents to send to ElasticSearch in batches. (can be set to very high number.).
- **elasticsearch_index** - ElasticSearch index where documents from watcher collection is saved.
- **elasticsearch_type** - ElasticSearch type given to documents from watcher collection.
- **esConnection**
  - **elasticsearch_server** - URL to a running ElasticSearch cluster.
  - **elasticsearch_httpAuth**
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

Next release.

## License

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.

[structure]:./test/img/structure.jpg "structure"

[mongodb]:./test/img/mongoDB.jpg "mongodb"

[elasticsearch]:./test/img/elasticsearch.jpg "elasticsearch"