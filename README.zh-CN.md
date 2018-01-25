# node-mongodb-es-connector

基于nodejs的用来实现mongodb和ElasticSearch之间的数据实时同步
![structure]

支持一对一,一对多,多对一和多对多的数据传输方式.

- **一对一** - 一个mongodb的collection对应一个elasticsearch的index之间的数据同步
- **一对多** - 一个mongodb的collection对应多个elasticsearch的index之间的数据同步
- **多对一** - 多个mongodb的collection对应一个elasticsearch的index之间的数据同步
- **多对多** - 多个mongodb的collection对应多个elasticsearch的index之间的数据同步

## 我当前的环境版本

    elasticsearch：v5.6.0
    mongodb: v3.2.10
    Nodejs: v8.9.3

## 这个工具是干什么的

node-mongodb-es-connector是用来保持你的mongoDB collections和你的elasticsearch index之间的数据实时同步.它是用mongo oplog来监听你的mongdb数据是否发生变化,无论是增删改查它都会及时反映到你的elasticsearch index上.在使用本工具之前你必须保证你的mongoDB是符合replica结构的,如果不是请先正确设置之后再使用此工具.

## 如何使用

```bash
npm install es-mongodb-sync
```

或者从GitHub上去[下载](https://github.com/zhr85210078/node-mongodb-es-connector/tree/master).

## 简单的例子

创建在**crawlerDataConfig**文件目录下创建一个js文件,命名规则如下:
`MongodbServers_port_ElasticsearchServer_port_MongodbDataBase_MongodbCollectionName_ElasticSearchIndexName.json`.

如果你需要更多的配置文件需要在`crawlerDataConfig`目录下创建.

例子:

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

- **mongodb_dataBase** - MongoDB里需要监听的数据库.
- **mongodb_collectionName** - MongoDB里需要监听的collection.
- **mongodb_filterQueryFilds** - MongoDB里的查询条件,目前支持一些简单的查询条件.(默认值为`null`)
- **mongodb_searchReturnFilds** - MongoDB需要返回的字段.(默认值为`null`)
- **mongodb_defaultValueFilds** - 不在MongoDB里存在的字段,但是需要存储到Elasticsearch的index里.(默认值为`null`)
- **mongodb_connection**
  - **mongodb_servers** - MongoDB服务器的地址.(replica结构,数组格式)
  - **mongodb_authentication** - 如果需要MongoDB的登录验证使用下面配置(默认值为`null`).
    - **userName** - MongoDB连接的用户名.
    - **passWord** - MongoDB连接的密码.
    - **authSource** - MongoDB用户认证,默认为`admin`.
    - **replicaSet** - MongoDB的repliac结构的名字.
- **mongodb_documentsinBatch** - 一次性从mongodb往Elasticsearch里传入数据的条数. (你可以设置比较大的值,默认为1000.).
- **elasticsearch_index** - ElasticSearch里的index.
- **elasticsearch_type** - ElasticSearch里的type,这里的type主要为了使用bulk.
- **esConnection**
  - **elasticsearch_server** - ElasticSearch的连接字符串.
  - **elasticsearch_httpAuth** - 如果ElasticSearch需要登录验证使用下面配置(默认值为`null`).
    - **userName** - ElasticSearch连接的用户名.
    - **passWord** - ElasticSearch连接的密码.

## 如何启动

```bash
node app.js
```

## 显示的结果

- **mongodb里面的数据**

![mongodb]

- **elasticsearch里面的数据**

![elasticsearch]

## 拓展API

index.js

- **Method**
  - **start()** - 必须在所有api之前启用.
  - **addSingleWatcher()** - 增加一个json配置文件.
  - **updateSingleWatcher()** - 修改一个json配置文件.
  - **deleteSingleWatcher()** - 删除一个json配置文件.
  - **isExistWatcher()** - 检查当前json配置文件是否存在.

英文文档 - [English Documentation](./ReadMe.md)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.

[structure]:./test/img/structure.jpg "structure"

[mongodb]:./test/img/mongoDB.jpg "mongodb"

[elasticsearch]:./test/img/elasticsearch.jpg "elasticsearch"