# node-mongodb-es-connector

基于nodejs的用来实现mongodb和ElasticSearch之间的数据实时同步 (支持附件同步)
![structure]

支持一对一,一对多的数据传输方式.

英文文档 - [English Documentation](./ReadMe.md)

- **一对一** - 一个mongodb的collection对应一个elasticsearch的一个index之间的数据同步
- **一对多** - 一个mongodb的collection对应一个elasticsearch的多个index之间的数据同步, 或者一个mongodb的collection对应多个elasticsearch的一个index之间的数据同步

## 我当前的环境版本

    elasticsearch: v6.1.2
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

创建在**crawlerData**文件目录下创建一个js文件,命名规则如下:
`ElasticSearchIndexName.json`,或者任意名称`.json`..

如果你需要更多的配置文件需要在`crawlerData`目录下创建.

例子:

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
        "number_of_replicas": 1
    }
}
```

- **m_database** - MongoDB里需要监听的数据库. (**必须**)
- **m_collectionname** - MongoDB里需要监听的collection. (**必须**)
- **m_filterfilds** - MongoDB里的查询条件,目前支持一些简单的查询条件.(默认值为`null`). (**必须**)
- **m_returnfilds** - MongoDB需要返回的字段.(默认值为`null`). (**必须**)
- **m_extendfilds** - 不在MongoDB里存在的字段,但是需要存储到Elasticsearch的index里.(默认值为`null`). (**可选**)
- **m_extendinit** - mongodb初始化补充配置.(默认值为`null`). (**可选**)
  - **m_comparefild** - MongoDB需要比较的字段.(默认值为`_id`或者是其他字段). (**可选**)
  - **m_comparefildType** - MongoDB需要比较的字段的数据类型.(默认值为`ObjectId`或者是`DateTime`). (**可选**)
  - **m_startFrom** - 起始时间.(默认值是一个DateTime类型的字符串). (**可选**)
  - **m_endTo** - 截止时间.(默认值是一个DateTime类型的字符串). (**可选**)
- **m_connection** (**必须**)
  - **m_servers** - MongoDB服务器的地址.(replica结构,数组格式). (**必须**)
  - **m_authentication** - 如果需要MongoDB的登录验证使用下面配置(默认值为`null`). (**必须**)
    - **username** - MongoDB连接的用户名. (**必须**)
    - **password** - MongoDB连接的密码. (**必须**)
    - **authsource** - MongoDB用户认证,默认为`admin`. (**必须**)
    - **replicaset** - MongoDB的repliac结构的名字. (**必须**)
    - **ssl** - MongoDB的ssl.(默认值为`false`). (**可选**)
- **m_url** - 替换`m_connection`节点(二选一). (**可选**)
- **m_documentsinbatch** - 一次性从mongodb往Elasticsearch里传入数据的条数. (你可以设置比较大的值,默认为1000). (**必须**)
- **m_delaytime** - 每次进elasticsearch数据的间隔时间(默认值为`1000`ms). (**必须**)
- **max_attachment_size** - 每个索引对应附件的最大字节数(默认值为`5242880`byte. (**可选**)
- **e_index** - ElasticSearch里的index. (**必须**)
- **e_type** - ElasticSearch里的type,这里的type主要为了使用bulk. (**必须**)
- **e_connection** (**必须**)
  - **e_server** - ElasticSearch的连接字符串. (**必须**)
  - **e_httpauth** - 如果ElasticSearch需要登录验证使用下面配置(默认值为`null`). (**可选**)
    - **username** - ElasticSearch连接的用户名. (**可选**)
    - **password** - ElasticSearch连接的密码. (**可选**)
- **e_pipeline** - ElasticSearch 中pipeline的名称. (**可选**)
- **e_iscontainattachment** - pipeline是否包含附件规则(默认值为`false`). (**可选**)
- **refresh_interval** - ElasticSearch里的index刷新时间(默认值为`30s`). (**selective**)
- **number_of_replicas** - ElasticSearch里的index副本(默认值为`1`). (**selective**)

## 如何启动

```bash
node app.js
```

![start]

## 拓展API

index.js (只用来做配置文件的增删改查)

[例子](https://github.com/zhr85210078/es-connector-api)

**1.start()** - must start up before all the APIs.

---

**2.addWatcher()** - 增加一个配置文件.

传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***返回值: true or false***

---

**3.updateWatcher()** - 修改一个配置文件.

传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |
| obj      | jsonObject  |

***返回值: true or false***

---

**4.deleteWatcher()** - 删除一个配置文件.

传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***返回值: true or false***

---

**5.isExistWatcher()** - 检查当前配置文件是否存在.

传参:

| Name     | Type        |
| -------- | --------    |
| fileName | string      |

***返回值: true or false***

---

**6.getInfoArray()** - 获取每个配置文件的当前状态.(waiting/initialling/running/stoped).

---

## 更新日志

- **v1.1.12** - 更新promise插件并且在当前项目中使用bluebird插件,支持超过1000条索引的实时数据同步,使用promise的消息队列.
- **v2.0.0** - 支持elasticsearch的pipeline,支持同步附件到elasticsearch.
- **v2.0.12** - 增加监听配置文件当前同步的状态(`getInfoArray()`).
- **v2.0.18** - 修改了日志目录.
- **v2.1.1** - 修改了初始化方法 (先进主文档->后进附件).
- **v2.1.8** - 使用promise队列 (在初始化操作和mongo-oplog触发事件).
- **v2.1.9** - 增加了 `m_extendfilds`节点和 `m_extendinit`节点.
- **v2.1.16** - 增加了监听mongodb断开连接的定时任务, 增加了重启服务根据时间戳初始化数据, 取消初始化全量同步.
- **v2.1.20** - 支持elasticsearch集群的数据同步.
- **v2.1.21** - 支持配置文件加密.

## 如何使用elasticsearch的pipeline

- **安装附件处理器插件**

    https://www.elastic.co/guide/en/elasticsearch/plugins/6.3/ingest-attachment.html

    更多关于 Elasticsearch Pipeline 相关的知识：
    https://www.felayman.com/articles/2017/11/24/1511527532643.html?utm_medium=hao.caibaojian.com&utm_source=hao.caibaojian.com

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