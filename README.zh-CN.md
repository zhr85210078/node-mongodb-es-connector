# node-mongodb-es-connector

基于nodejs的用来实现mongodb和ElasticSearch之间的数据实时同步 (支持附件同步)
![structure]

支持一对一,一对多的数据传输方式.

- **一对一** - 一个mongodb的collection对应一个elasticsearch的一个index之间的数据同步
- **一对多** - 一个mongodb的collection对应一个elasticsearch的多个index之间的数据同步,
                或者一个mongodb的collection对应多个elasticsearch的一个index之间的数据同步

## 我当前的环境版本

    elasticsearch：v6.1.2
    mongodb: v3.6.2
    Nodejs: v8.9.3

## 这个工具是干什么的

node-mongodb-es-connector是用来保持你的mongoDB collections和你的elasticsearch index之间的数据实时同步.它是用mongo oplog来监听你的mongdb数据是否发生变化,无论是增删改查它都会及时反映到你的elasticsearch index上.在使用本工具之前你必须保证你的mongoDB是符合replica结构的,如果不是请先正确设置之后再使用此工具.(支持附件同步)

## 如何使用

```bash
npm install es-mongodb-sync
```

或者从GitHub上去[下载](https://github.com/zhr85210078/node-mongodb-es-connector/tree/master).

## 简单的例子

创建在**crawlerDataConfig**文件目录下创建一个js文件,命名规则如下:
`ElasticSearchIndexName.json`,或者任意名称`.json`..

如果你需要更多的配置文件需要在`crawlerDataConfig`目录下创建.

例子:

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

- **m_database** - MongoDB里需要监听的数据库.
- **m_collectionname** - MongoDB里需要监听的collection.
- **m_filterfilds** - MongoDB里的查询条件,目前支持一些简单的查询条件.(默认值为`null`)
- **m_returnfilds** - MongoDB需要返回的字段.(默认值为`null`)
- **m_connection**
  - **m_servers** - MongoDB服务器的地址.(replica结构,数组格式)
  - **m_authentication** - 如果需要MongoDB的登录验证使用下面配置(默认值为`null`).
    - **username** - MongoDB连接的用户名.
    - **password** - MongoDB连接的密码.
    - **authsource** - MongoDB用户认证,默认为`admin`.
    - **replicaset** - MongoDB的repliac结构的名字.
    - **ssl** - MongoDB的ssl.(默认值为`false`)
- **m_url** - 替换`m_connection`节点(二选一)
- **m_masterdocbatch** - (`主文档`) 一次性从mongodb往Elasticsearch里传入数据的条数. (你可以设置比较大的值,默认为1000).
- **m_masterdocdelay** - (`主文档`) 每次进elasticsearch数据的间隔时间(默认值为`1000`ms).
- **m_attachmentbatch** - (`附件`) 一次性从mongodb往Elasticsearch里传入数据的条数. (你可以设置比较大的值,默认为1000).
- **m_attachmentdelay** - (`附件`) 每次进elasticsearch数据的间隔时间(默认值为`1000`ms).
- **e_index** - ElasticSearch里的index.
- **e_type** - ElasticSearch里的type,这里的type主要为了使用bulk.
- **e_connection**
  - **e_server** - ElasticSearch的连接字符串.
  - **e_httpauth** - 如果ElasticSearch需要登录验证使用下面配置(默认值为`null`).
    - **username** - ElasticSearch连接的用户名.
    - **password** - ElasticSearch连接的密码.
- **e_pipeline** - ElasticSearch 中pipeline的名称.
- **e_iscontainattachment** - pipeline是否包含附件规则(默认值为`false`).

## 如何启动

```bash
node app.js
```

![start]

## 拓展API

index.js (只用来做配置文件的增删改查)

[例子](https://github.com/zhr85210078/es-connector-api)

**start()** - must start up before all the APIs.

---

**addWatcher()** - 增加一个配置文件.
传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***返回值: true or false***

---

**updateWatcher()** - 修改一个配置文件.
传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***返回值: true or false***

---

**deleteWatcher()** - 删除一个配置文件.
传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***返回值: true or false***

---

**isExistWatcher()** - 检查当前配置文件是否存在.
传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***返回值: true or false***

---

**getInfoArray()** - 获取每个配置文件的当前状态(waiting/initialling/running/stoped).

---

英文文档 - [English Documentation](./ReadMe.md)

## 更新日志

- **v1.1.12** - 更新promise插件并且在当前项目中使用bluebird插件,支持超过1000条索引的实时数据同步,使用promise的消息队列.
- **v2.0.0** - 支持elasticsearch的pipeline,支持同步附件到elasticsearch.
- **v2.0.12** - 增加监听配置文件当前同步的状态(`getInfoArray()`).
- **v2.0.18** - 修改了日志目录.
- **v2.1.1** - 修改了初始化方法 (先进主文档->后进附件).

## 如何使用elasticsearch的pipeline

- **准备在elasticsearch中创建一个pipeline**

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

## 显示的结果

- **mongodb里面的数据**

![mongodb]

- **elasticsearch里面的数据**

![elasticsearch]

## 测试

![test]

## License

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.

[structure]:./test/img/structure.jpg "structure"

[start]:./test/img/start.gif "start"

[mongodb]:./test/img/mongoDB.jpg "mongodb"

[elasticsearch]:./test/img/elasticsearch.jpg "elasticsearch"

[test]:./test/img/test.gif "test"