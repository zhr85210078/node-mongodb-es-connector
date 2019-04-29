# node-mongodb-es-connector

MongoDB and ElasticSearch sync module for node (support attachment sync)
![structure]

Supports one-to-one and one-to-many relationships.

Chinese Documentation - [中文文档](./README.zh-CN.md)

- **one-to-one** - one mongodb collection to one elasticsearch index
- **one-to-many** - one mongodb collection to one elasticsearch server many indexs, or one mongodb collection to many elasticsearch servers one index

## my current version

    elasticsearch: v6.1.2
    mongodb: v3.6.2
    Nodejs: v8.9.3

## What does it do

node-mongodb-es-connector package keeps your mongoDB collections and elastic search cluster in sync. It does so by tailing the mongo oplog and replicate whatever crud operation into elastic search cluster without any overhead. Please note that a replica set is needed for the package to tail mongoDB.(support attentment sync)

## How to use

```bash
npm install es-mongodb-sync
```

or [Download](https://github.com/zhr85210078/node-mongodb-es-connector/tree/master) from GitHub.

## Sample usage

Create a file in the **crawlerData** folder,the Naming rules is `ElasticSearchIndexName.json` or any name `.json`.

If you have more additional configuration in the `crawlerData` folder.

For example:

`mybooks.json`

```bash
{
    "mongodb": {
        "m_database": "myTest",
        "m_collectionname": "books",
        "m_filterfilds": {
            "version" : "2.0"
        },
        "m_returnfilds": {
            "bName": 1,
            "bPrice": 1,
            "bImgSrc": 1
        },
        "m_extendfilds": {
            "bA": "this is a extend fild bA",
            "bB": "this is a extend fild bB"
        },
        "m_extendinit": {
            "m_comparefild": "_id",
            "m_comparefildType": "ObjectId",
            "m_startFrom": "2018-07-20 13:44:00",
            "m_endTo": "2018-07-20 13:46:59"
        },
        "m_connection": {
            "m_servers": [
                "localhost:29031",
                "localhost:29032",
                "localhost:29033"
            ],
            "m_authentication": {
                "username": "UserAdmin",
                "password": "pass1234",
                "authsource":"admin",
                "replicaset":"my_replica",
                "ssl":false
            }
        },
        "m_documentsinbatch": 5000,
        "m_delaytime": 1000,
        "max_attachment_size":5242880
    },
    "elasticsearch": {
        "e_index": "mybooks",
        "e_type": "books",
        "e_connection": {
            "e_server": "http://localhost1:9200,http://localhost2:9200,http://localhost3:9200",
            "e_httpauth": {
                "username": "EsAdmin",
                "password": "pass1234"
            }
        },
        "e_pipeline": "mypipeline",
        "e_iscontainattachment": true,
        "refresh_interval": "30s",
        "number_of_replicas": 0
    }
}
```

- **m_database** - MongoDB dataBase to watch. (**required**)
- **m_collectionname** - MongoDB collection to watch. (**required**)
- **m_filterfilds** - MongoDB filterQuery,support simple filter.(Default value is `null`). (**required**)
- **m_returnfilds** - MongoDB need to return to the field.(Default value is `null`). (**required**)
- **m_extendfilds** - MongoDB expand field.(can default key and value). (**selective**)
- **m_extendinit** - Mongodb initialization supplemental configuration. (Default value is `null`). (**selective**)
  - **m_comparefild** - MongoDB compare fild.(Default value is `_id` or other). (**selective**)
  - **m_comparefildType** - MongoDB compare fild type.(Default value is `ObjectId` or `DateTime`). (**selective**)
  - **m_startFrom** - StartTime.(Default value is a DateTime). (**selective**)
  - **m_endTo** - EndTime.(Default value is a DateTime). (**selective**)
- **m_connection** (**required**)
  - **m_servers** - MongoDB servers.(Array). (**required**)
  - **m_authentication** - If you do not need to verify the default value is `null`. (**required**)
    - **username** - MongoDB connection userName. (**required**)
    - **password** - MongoDB connection passWord. (**required**)
    - **authsource** - MongoDB user authentication. (**required**)
    - **replicaset** - MongoDB replicaSet name. (**required**)
    - **ssl** - MongoDB ssl.(Default value is `false`). (**selective**)
- **m_url** - replace `m_connection`(Either-or) (**selective**).
- **m_documentsinbatch** - An integer that specifies number of documents to send to ElasticSearch in batches (can be set to very high number). (**required**)
- **m_delaytime** - Number of milliseconds between batches the default value is `1000`ms. (**required**)
- **max_attachment_size** - Attachment max size the default value is `5242880`byte. (**selective**)
- **e_index** - ElasticSearch index where documents from watcher collection is saved. (**required**)
- **e_type** - ElasticSearch type given to documents from watcher collection. (**required**)
- **e_connection** (**required**)
  - **e_server** - URL to a running ElasticSearch cluster. (**required**)
  - **e_httpauth** - If you do not need to verify the default value is `null`. (**selective**)
    - **username** - ElasticSearch connection userName. (**selective**)
    - **password** - ElasticSearch connection passWord. (**selective**)
- **e_pipeline** - ElasticSearch pipeline name. (**selective**)
- **e_iscontainattachment** - Is or not contain attachment the default value is `false`. (**selective**)
- **refresh_interval** - Index refresh interval the default value is `30s`. (**selective**)
- **number_of_replicas** - Index replicas the default value is `1`. (**selective**)

## Start up

```bash
node app.js
```

![start]

## Extra APIs

index.js (only crud config json )

[Example](https://github.com/zhr85210078/es-connector-api)

**1.start()** - must start up before all the APIs.

---

**2.addWatcher()** - add a config json.

Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***return: true or false***

---

**3.updateWatcher()** - update a config json.

Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***return: true or false***

---

**4.deleteWatcher()** - delete a config json.

Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***return: true or false***

---

**5.isExistWatcher()** - check out this config json exist.

Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***return: true or false***

---

**6.getInfoArray()** - get every config status.(waiting/initialling/running/stoped).

---

## ChangeLog

- **v1.1.12** - update promise plugin,and referencing the Bluebird plugin in the project.Real-time synchronization in support of more than 1000 indexes.Message queues using promise.
- **v2.0.0** - support elasticsearch pipeline aggregations and attachment into elasticsearch.
- **v2.0.12** - add watch config file sync status(`getInfoArray()`).
- **v2.0.18** - update logs directory.
- **v2.1.1** - update init method (master doc->attachment).
- **v2.1.8** - use promise queue (init and mongo-oplog).
- **v2.1.9** - add `m_extendfilds` and `m_extendinit`.
- **v2.1.16** - add timed task about watch mongodb, add timestamp for init data, cancel full data synchronization in init.
- **v2.1.20** - support elasticsearch cluster synchronization.
- **v2.1.21** - support configuration file encryption.

## How to use pipeline

- **Install Ingest Attachment Processor Plugin**

    https://www.elastic.co/guide/en/elasticsearch/plugins/6.3/ingest-attachment.html

    more Elasticsearch Pipeline knowledge：
    https://www.felayman.com/articles/2017/11/24/1511527532643.html?utm_medium=hao.caibaojian.com&utm_source=hao.caibaojian.com

- **prepare make a pipeline in elasticsearch**

```bash
PUT _ingest/pipeline/mypipeline
{
  "description" : "Extract attachment information from arrays",
  "processors" : [
    {
      "foreach": {
        "field": "attachments",
        "processor": {
          "attachment": {
            "target_field": "_ingest._value.attachment",
            "field": "_ingest._value.data"
          }
        }
      }
    }
  ]
}
```

## Result

- **mongodbData**

![mongodb]

- **elasticsearch**

![elasticsearch]

## Test

![test]

## License

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.

[structure]:./test/img/structure.jpg "structure"

[start]:./test/img/start.gif "start"

[mongodb]:./test/img/mongoDB.jpg "mongodb"

[elasticsearch]:./test/img/elasticsearch.jpg "elasticsearch"

[test]:./test/img/test.gif "test"