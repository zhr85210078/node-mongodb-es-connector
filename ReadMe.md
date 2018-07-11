# node-mongodb-es-connector

ElasticSearch and MongoDB sync module for node (support attachment sync)
![structure]

Supports one-to-one and one-to-many relationships.

- **one-to-one** - one mongodb collection to one elasticsearch index
- **one-to-many** - one mongodb collection to one elasticsearch server many indexs,
                    or one mongodb collection to many elasticsearch servers one index

## my current version

    elasticsearch：v6.1.2
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

Create a file in the **crawlerDataConfig** folder,the Naming rules is `ElasticSearchIndexName.json` or any name `.json`.

If you have more additional configuration in the `crawlerDataConfig` folder.

For example:

`mycarts.json`

```bash
{
    "mongodb": {
        "m_database": "myTest",
        "m_collectionname": "carts",
        "m_filterfilds": {
            "version" : "2.0"
        },
        "m_returnfilds": {
            "cName": 1,
            "cPrice": 1,
            "cImgSrc": 1
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
        "m_masterdocbatch": 5000,
        "m_masterdocdelay": 1000,
        "m_attachmentbatch": 10,
        "m_attachmentdelay": 5000
    },
    "elasticsearch": {
        "e_index": "mycarts",
        "e_type": "carts",
        "e_connection": {
            "e_server": "http://localhost:9200",
            "e_httpauth": {
                "username": "EsAdmin",
                "password": "pass1234"
            }
        },
        "e_pipeline": "mypipeline",
        "e_iscontainattachment": true
    }
}
```

- **m_database** - MongoDB dataBase to watch.
- **m_collectionname** - MongoDB collection to watch.
- **m_filterfilds** - MongoDB filterQuery,support simple filter.(Default value is `null`)
- **m_returnfilds** - MongoDB need to return to the field.(Default value is `null`)
- **m_connection**
  - **m_servers** - MongoDB servers.(Array)
  - **m_authentication** - If you do not need to verify the default value is `null`.
    - **username** - MongoDB connection userName.
    - **password** - MongoDB connection passWord.
    - **authsource** - MongoDB user authentication.
    - **replicaset** - MongoDB replicaSet name.
    - **ssl** - MongoDB ssl.(Default value is `false`)
- **m_url** - replace `m_connection`(Either-or)
- **m_masterdocbatch** - (`Master Doc`) An integer that specifies number of documents to send to ElasticSearch in batches (can be set to very high number).
- **m_masterdocdelay** - (`Master Doc`) Number of milliseconds between batches the default value is `1000`ms.
- **m_attachmentbatch** - (`Attachment`) An integer that specifies number of documents to send to ElasticSearch in batches (can be set to very high number).
- **m_attachmentdelay** - (`Attachment`) Number of milliseconds between batches the default value is `1000`ms.
- **e_index** - ElasticSearch index where documents from watcher collection is saved.
- **e_type** - ElasticSearch type given to documents from watcher collection.
- **e_connection**
  - **e_server** - URL to a running ElasticSearch cluster.
  - **e_httpauth** - If you do not need to verify the default value is `null`.
    - **username** - ElasticSearch connection userName.
    - **password** - ElasticSearch connection passWord.
- **e_pipeline** - ElasticSearch pipeline name.
- **e_iscontainattachment** - Is or not contain attachment the default value is `false`.

## Start up

```bash
node app.js
```

![start]

## Extra APIs

index.js (only crud config json )

[Example](https://github.com/zhr85210078/es-connector-api)

**start()** - must start up before all the APIs.

---

**addWatcher()** - add a config json.
Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***return: true or false***

---

**updateWatcher()** - update a config json.
Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***return: true or false***

---

**deleteWatcher()** - delete a config json.
Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***return: true or false***

---

**isExistWatcher()** - check out this config json exist.
Parameters:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***return: true or false***

---

**getInfoArray()** - get every config status(waiting/initialling/running/stoped).

---

Chinese Documentation - [中文文档](./README.zh-CN.md)

## ChangeLog

- **v1.1.12** - update promise plugin,and referencing the Bluebird plugin in the project.Real-time synchronization in support of more than 1000 indexes.Message queues using promise.
- **v2.0.0** - support elasticsearch pipeline aggregations and attachment into elasticsearch.
- **v2.0.12** - add watch config file sync status(`getInfoArray()`).
- **v2.0.18** - update logs directory.
- **v2.1.1** - update init method (master doc->attachment).

## How to use pipeline

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